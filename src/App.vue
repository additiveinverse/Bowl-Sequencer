<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getBallPosition, PIN_LAYOUT, simulateThrow } from './bowling.js'
import { generatePattern } from './pattern.js'

const canvas = ref(null)
const aim = ref(0)
const power = ref(0.72)
const hook = ref(0)
const pins = ref(Array.from({ length: 10 }, (_, index) => index))
const phase = ref('ready')
const frame = ref(1)
const throwNumber = ref(1)
const framePins = ref(0)
const totalPins = ref(0)
const artifacts = ref([])
const latestArtifact = ref(null)
const ballProgress = ref(0)

let animationFrame = 0
let throwStartedAt = 0
let resizeObserver

const isFrameComplete = computed(() => {
  if (!latestArtifact.value) return false
  return latestArtifact.value.outcome.strike || throwNumber.value === 2
})

const frameResult = computed(() => {
  if (!latestArtifact.value) return ''
  if (latestArtifact.value.outcome.strike) return 'STRIKE'
  if (isFrameComplete.value && framePins.value === 10) return 'SPARE'
  return isFrameComplete.value ? 'OPEN FRAME' : 'FIRST THROW'
})

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function makeArtifact(simulation) {
  const { knockedPins, remainingPins } = simulation
  const generated = generatePattern(remainingPins, power.value)

  return {
    timestamp: new Date().toISOString(),
    frame: frame.value,
    throw: throwNumber.value,
    approach: {
      trajectory: simulation.trajectory,
      travelTime: 2.2,
      releasePower: Number(power.value.toFixed(2)),
      hookAmount: Number(hook.value.toFixed(2)),
    },
    impact: {
      impactX: Number(simulation.impactX.toFixed(3)),
      impactY: Number(simulation.impactY.toFixed(3)),
      impactEnergy: Number(power.value.toFixed(2)),
      firstPinHit: simulation.firstPinHit === null ? null : simulation.firstPinHit + 1,
    },
    outcome: {
      pinsRemaining: remainingPins.map((pin) => pin + 1),
      pinsKnockedDown: knockedPins.length,
      score: knockedPins.length,
      strike: throwNumber.value === 1 && knockedPins.length === 10,
      spare: throwNumber.value === 2 && framePins.value + knockedPins.length === 10,
      split: false,
    },
    pattern: generated.pattern,
    seed: generated.seed,
    drums: generated.drums,
    velocityMap: generated.velocityMap,
    accentMap: generated.accentMap,
  }
}

function launch() {
  if (phase.value !== 'ready' || frame.value > 10) return
  phase.value = 'rolling'
  ballProgress.value = 0
  throwStartedAt = performance.now()
}

function finishThrow() {
  const simulation = simulateThrow({
    standingPins: pins.value,
    aim: aim.value,
    power: power.value,
    hook: hook.value,
  })
  const artifact = makeArtifact(simulation)

  pins.value = simulation.remainingPins
  framePins.value += simulation.knockedPins.length
  totalPins.value += simulation.knockedPins.length
  artifacts.value.push(artifact)
  latestArtifact.value = artifact
  phase.value = 'result'
}

function advance() {
  if (phase.value !== 'result') return

  if (isFrameComplete.value) {
    frame.value += 1
    throwNumber.value = 1
    framePins.value = 0
    pins.value = Array.from({ length: 10 }, (_, index) => index)
  } else {
    throwNumber.value = 2
  }

  latestArtifact.value = null
  phase.value = frame.value > 10 ? 'gameover' : 'ready'
}

function restartGame() {
  aim.value = 0
  power.value = 0.72
  hook.value = 0
  pins.value = Array.from({ length: 10 }, (_, index) => index)
  phase.value = 'ready'
  frame.value = 1
  throwNumber.value = 1
  framePins.value = 0
  totalPins.value = 0
  artifacts.value = []
  latestArtifact.value = null
  ballProgress.value = 0
}

function exportArtifacts() {
  const blob = new Blob([JSON.stringify(artifacts.value, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'bowl-sequencer-artifacts.json'
  link.click()
  URL.revokeObjectURL(url)
}

function drawLane() {
  const element = canvas.value
  if (!element) return
  const context = element.getContext('2d')
  const bounds = element.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 2)

  if (element.width !== Math.round(bounds.width * ratio) || element.height !== Math.round(bounds.height * ratio)) {
    element.width = Math.round(bounds.width * ratio)
    element.height = Math.round(bounds.height * ratio)
  }

  const width = bounds.width
  const height = bounds.height
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#080b16'
  context.fillRect(0, 0, width, height)

  const laneLeft = width * 0.18
  const laneRight = width * 0.82
  const laneTop = height * 0.08
  const laneBottom = height * 0.96
  const lane = context.createLinearGradient(0, laneTop, 0, laneBottom)
  lane.addColorStop(0, '#1c2447')
  lane.addColorStop(0.52, '#101a36')
  lane.addColorStop(1, '#18204a')
  context.shadowColor = '#49e8ff'
  context.shadowBlur = 20
  context.fillStyle = lane
  context.fillRect(laneLeft, laneTop, laneRight - laneLeft, laneBottom - laneTop)
  context.shadowBlur = 0

  context.strokeStyle = 'rgba(86, 222, 255, 0.35)'
  context.lineWidth = 2
  context.strokeRect(laneLeft, laneTop, laneRight - laneLeft, laneBottom - laneTop)
  for (let marker = 1; marker <= 7; marker += 1) {
    const y = laneTop + (laneBottom - laneTop) * marker / 8
    context.strokeStyle = 'rgba(134, 154, 255, 0.12)'
    context.beginPath()
    context.moveTo(laneLeft + 8, y)
    context.lineTo(laneRight - 8, y)
    context.stroke()
  }

  for (const pin of pins.value) {
    const position = PIN_LAYOUT[pin]
    const x = width / 2 + position.x * (laneRight - laneLeft)
    const y = laneTop + (1 - position.y) / 2 * (laneBottom - laneTop)
    context.shadowColor = '#ff56d8'
    context.shadowBlur = 12
    context.fillStyle = '#fff6ff'
    context.beginPath()
    context.ellipse(x, y, 5, 8, 0, 0, Math.PI * 2)
    context.fill()
    context.shadowBlur = 0
    context.fillStyle = '#ff56d8'
    context.fillRect(x - 4, y - 2, 8, 2)
  }

  let ballY = laneBottom - 32
  let ballX = width / 2 + getBallPosition(aim.value, hook.value, 0).x * (laneRight - laneLeft)
  if (phase.value === 'rolling') {
    ballY = laneBottom - (laneBottom - laneTop - 48) * ballProgress.value
    ballX = width / 2 + getBallPosition(aim.value, hook.value, ballProgress.value).x * (laneRight - laneLeft)
  }
  context.shadowColor = '#52f5ff'
  context.shadowBlur = 22
  const ball = context.createRadialGradient(ballX - 5, ballY - 5, 1, ballX, ballY, 15)
  ball.addColorStop(0, '#ffffff')
  ball.addColorStop(0.28, '#70f8ff')
  ball.addColorStop(1, '#237aff')
  context.fillStyle = ball
  context.beginPath()
  context.arc(ballX, ballY, 13, 0, Math.PI * 2)
  context.fill()
  context.shadowBlur = 0
}

function animate(now) {
  if (phase.value === 'rolling') {
    ballProgress.value = clamp((now - throwStartedAt) / 2200, 0, 1)
    if (ballProgress.value >= 1) finishThrow()
  }
  drawLane()
  animationFrame = requestAnimationFrame(animate)
}

function onKeydown(event) {
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    if (phase.value !== 'ready') return
    event.preventDefault()
    aim.value = clamp(aim.value + (event.code === 'ArrowLeft' ? -0.05 : 0.05), -1, 1)
  } else if (event.code === 'Space') {
    event.preventDefault()
    launch()
  } else if (event.code === 'Enter' && phase.value === 'result') {
    advance()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  resizeObserver = new ResizeObserver(drawLane)
  if (canvas.value) resizeObserver.observe(canvas.value)
  animationFrame = requestAnimationFrame(animate)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  resizeObserver?.disconnect()
  cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <main class="shell">
    <header class="topbar">
      <a class="wordmark" href="#" aria-label="Bowl Sequencer home">
        <span class="logo-mark">◉</span>
        <span>BOWL<span class="accent">/</span>SEQUENCER</span>
      </a>
      <div class="session-stats">
        <span>FRAME <b>{{ Math.min(frame, 10) }} / 10</b></span>
        <span>PINS <b>{{ totalPins }}</b></span>
      </div>
    </header>

    <section class="game-layout">
      <div class="game-column">
        <div class="section-heading">
          <div>
            <p class="eyebrow">ARCADE BOWLING / GROOVE GENERATOR</p>
            <h1>Find your <span>rhythm.</span></h1>
          </div>
          <div class="live-status"><i></i>{{ phase === 'rolling' ? 'BALL IN PLAY' : phase === 'gameover' ? 'SESSION COMPLETE' : 'SYSTEM READY' }}</div>
        </div>

        <div class="lane-frame">
          <canvas ref="canvas" class="lane-canvas" aria-label="Arcade bowling lane with remaining pins"></canvas>
          <div class="lane-label lane-label-top">PIN DECK <span>01—10</span></div>
          <div class="lane-label lane-label-bottom">RELEASE LINE <span>THROW {{ throwNumber }}</span></div>
          <div class="lane-side-meter"><span></span><span></span><span></span></div>
        </div>

        <div class="control-row">
          <label class="control">
            <span class="control-title">AIM <b>{{ aim.toFixed(2) }}</b></span>
            <input v-model.number="aim" type="range" min="-1" max="1" step="0.01" :disabled="phase !== 'ready'" aria-label="Aim" />
          </label>
          <label class="control">
            <span class="control-title">POWER <b>{{ Math.round(power * 100) }}%</b></span>
            <input v-model.number="power" type="range" min="0.2" max="1" step="0.01" :disabled="phase !== 'ready'" aria-label="Power" />
          </label>
          <label class="control">
            <span class="control-title">HOOK <b>{{ hook.toFixed(2) }}</b></span>
            <input v-model.number="hook" type="range" min="-1" max="1" step="0.01" :disabled="phase !== 'ready'" aria-label="Hook" />
          </label>
          <button v-if="phase === 'ready'" class="primary-button" @click="launch">
            THROW <span>↗</span>
          </button>
          <button v-else-if="phase === 'result'" class="primary-button" @click="advance">
            {{ isFrameComplete ? 'NEXT FRAME' : 'NEXT THROW' }} <span>↗</span>
          </button>
          <button v-else-if="phase === 'gameover'" class="primary-button" @click="restartGame">
            PLAY AGAIN <span>↗</span>
          </button>
          <button v-else class="primary-button" disabled>ROLLING…</button>
        </div>
        <p class="keyboard-hint"><kbd>←</kbd><kbd>→</kbd> adjust aim <kbd>SPACE</kbd> throw <kbd>ENTER</kbd> continue</p>
      </div>

      <aside class="score-panel">
        <div class="panel-block">
          <p class="eyebrow">FRAME {{ Math.min(frame, 10) }} / THROW {{ throwNumber }}</p>
          <template v-if="latestArtifact">
            <h2 class="result-title">{{ frameResult }}</h2>
            <p class="result-caption">{{ latestArtifact.outcome.pinsKnockedDown }} pin{{ latestArtifact.outcome.pinsKnockedDown === 1 ? '' : 's' }} down · seed {{ latestArtifact.seed }}</p>
          </template>
          <template v-else-if="phase === 'gameover'">
            <h2 class="result-title">SESSION END</h2>
            <p class="result-caption">{{ artifacts.length }} throws archived · {{ totalPins }} pins down</p>
          </template>
          <template v-else>
            <h2 class="result-title idle-title">READY TO ROLL</h2>
            <p class="result-caption">Line it up. Let the groove follow.</p>
          </template>
        </div>

        <div v-if="latestArtifact" class="pattern-block">
          <div class="block-heading"><span>GENERATED PATTERN</span><span class="seed-tag">SEED {{ latestArtifact.seed }}</span></div>
          <pre class="pattern">{{ latestArtifact.pattern }}</pre>
          <div class="map-preview">
            <div class="block-heading"><span>VELOCITY MAP</span><span>16 STEP</span></div>
            <div class="velocity-bars">
              <span v-for="(velocity, index) in latestArtifact.velocityMap" :key="index" :style="{ height: `${Math.max(3, velocity * 0.32)}px` }" :class="{ accent: latestArtifact.accentMap[index] }"></span>
            </div>
          </div>
        </div>
        <div v-else class="pattern-placeholder">
          <span class="placeholder-icon">♫</span>
          <p>Every throw becomes a new pattern.</p>
          <small>Outcome data → deterministic groove</small>
        </div>

        <div class="panel-footer">
          <span>{{ artifacts.length }} ARTIFACT{{ artifacts.length === 1 ? '' : 'S' }} STORED</span>
          <button class="text-button" :disabled="!artifacts.length" @click="exportArtifacts">EXPORT JSON <span>↓</span></button>
        </div>
      </aside>
    </section>

    <footer class="footer"><span>ONE MORE THROW.</span><span>PROTOTYPE BUILD 0.1</span></footer>
  </main>
</template>
