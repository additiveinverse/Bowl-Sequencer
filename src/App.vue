<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getBallPosition, PIN_LAYOUT, simulateThrow } from './bowling.js'
import { getFrameTransition, getScorecard } from './scoring.js'
import { playPinImpact, setSoundMuted, startRollSound, stopRollSound } from './sound.js'

const canvas = ref(null)
const aim = ref(0)
const power = ref(0.72)
const hook = ref(0)
const pins = ref(Array.from({ length: 10 }, (_, index) => index))
const frames = ref(Array.from({ length: 10 }, () => ({ rolls: [], complete: false })))
const currentFrame = ref(0)
const phase = ref('ready')
const soundEnabled = ref(true)
const ballProgress = ref(0)
const lastRoll = ref(null)
const fallenPins = ref([])
const trail = ref([])
const impactFlash = ref(null)

let animationFrame = 0
let throwStartedAt = 0
let resizeObserver

const scorecard = computed(() => getScorecard(frames.value))
const currentFrameState = computed(() => frames.value[currentFrame.value])
const throwNumber = computed(() => currentFrameState.value.rolls.length + 1)
const totalScore = computed(() => {
  const resolved = [...scorecard.value].reverse().find((frame) => frame.cumulative !== null)
  const hasThrown = frames.value.some((frame) => frame.rolls.length > 0)
  return resolved?.cumulative ?? (hasThrown ? '—' : 0)
})

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getRollLabel(frameIndex, previousRolls, pinsDown, gutter) {
  const rollNumber = previousRolls.length + 1
  if (frameIndex < 9) {
    if (rollNumber === 1 && pinsDown === 10) return 'STRIKE!'
    if (rollNumber === 2 && previousRolls[0] + pinsDown === 10) return 'SPARE!'
  } else {
    if (rollNumber === 2 && previousRolls[0] === 10 && pinsDown === 10) return 'DOUBLE!'
    if (rollNumber === 2 && previousRolls[0] < 10 && previousRolls[0] + pinsDown === 10) return 'SPARE!'
    if (rollNumber === 3 && previousRolls[0] === 10 && previousRolls[1] < 10 && previousRolls[1] + pinsDown === 10) return 'SPARE!'
    if (pinsDown === 10) return 'STRIKE!'
  }
  if (pinsDown === 0) return gutter ? 'GUTTER' : 'NO CONTACT'
  return `${pinsDown} DOWN`
}

function launch() {
  if (phase.value !== 'ready') return
  phase.value = 'rolling'
  ballProgress.value = 0
  trail.value = []
  impactFlash.value = null
  fallenPins.value = []
  startRollSound()
  throwStartedAt = performance.now()
}

function finishThrow() {
  stopRollSound()
  const frameIndex = currentFrame.value
  const previousRolls = currentFrameState.value.rolls
  const simulation = simulateThrow({
    standingPins: pins.value,
    aim: aim.value,
    power: power.value,
    hook: hook.value,
  })
  const pinsDown = simulation.knockedPins.length
  playPinImpact(pinsDown)
  const rolls = [...previousRolls, pinsDown]
  const transition = getFrameTransition(frameIndex, rolls)

  frames.value[frameIndex] = { rolls, complete: transition.frameComplete }
  pins.value = simulation.remainingPins
  lastRoll.value = {
    frame: frameIndex + 1,
    throw: rolls.length,
    pinsDown,
    pinsStanding: pins.value.length,
    label: getRollLabel(frameIndex, previousRolls, pinsDown, simulation.gutter),
    transition,
  }

  const now = performance.now()
  fallenPins.value = simulation.pinfall.map(({ id, energy }) => {
    const position = PIN_LAYOUT[id]
    return {
      id,
      energy,
      startAt: now + Math.max(0, (position.y - 0.55) * 650),
      direction: Math.sign(position.x - simulation.impactX) || (id % 2 ? 1 : -1),
    }
  })
  if (simulation.firstPinHit !== null) {
    impactFlash.value = { startedAt: now, progress: simulation.impactY, x: simulation.impactX }
  }
  phase.value = 'result'
}

function advance() {
  if (phase.value === 'gameover') {
    restartGame()
    return
  }
  if (phase.value !== 'result') return

  const { transition } = lastRoll.value
  if (transition.gameOver) {
    phase.value = 'gameover'
    return
  }

  if (transition.frameComplete) {
    currentFrame.value += 1
    pins.value = Array.from({ length: 10 }, (_, index) => index)
  } else if (transition.newRack) {
    pins.value = Array.from({ length: 10 }, (_, index) => index)
  }

  lastRoll.value = null
  ballProgress.value = 0
  trail.value = []
  fallenPins.value = []
  impactFlash.value = null
  phase.value = 'ready'
}

function restartGame() {
  stopRollSound()
  aim.value = 0
  power.value = 0.72
  hook.value = 0
  pins.value = Array.from({ length: 10 }, (_, index) => index)
  frames.value = Array.from({ length: 10 }, () => ({ rolls: [], complete: false }))
  currentFrame.value = 0
  phase.value = 'ready'
  ballProgress.value = 0
  lastRoll.value = null
  fallenPins.value = []
  trail.value = []
  impactFlash.value = null
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  setSoundMuted(!soundEnabled.value)
}

function drawPin(context, x, y, scale, rotation, alpha, radius) {
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.globalAlpha = alpha
  context.shadowColor = '#ff5baf'
  context.shadowBlur = 12 * scale
  context.fillStyle = '#fffaff'
  context.beginPath()
  context.moveTo(-radius * 0.7, radius * 1.15)
  context.bezierCurveTo(-radius * 0.45, radius * 0.5, -radius * 0.6, -radius * 0.1, -radius * 0.34, -radius * 0.52)
  context.quadraticCurveTo(-radius * 0.64, -radius * 1.25, 0, -radius * 1.28)
  context.quadraticCurveTo(radius * 0.64, -radius * 1.25, radius * 0.34, -radius * 0.52)
  context.bezierCurveTo(radius * 0.6, -radius * 0.1, radius * 0.45, radius * 0.5, radius * 0.7, radius * 1.15)
  context.quadraticCurveTo(0, radius * 1.48, -radius * 0.7, radius * 1.15)
  context.fill()
  context.shadowBlur = 0
  context.fillStyle = '#ff4fa6'
  context.fillRect(-radius * 0.45, -radius * 0.12, radius * 0.9, Math.max(2, radius * 0.14))
  context.restore()
}

function drawLane(now = performance.now()) {
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
  const centerX = width / 2
  const laneTop = height * 0.075
  const laneBottom = height * 0.96
  const laneHeight = laneBottom - laneTop
  const laneY = (progress) => laneTop + (1 - progress) * laneHeight
  const laneWidthAt = (y) => width * (0.38 + 0.31 * clamp((y - laneTop) / laneHeight, 0, 1))

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#090b14'
  context.fillRect(0, 0, width, height)

  const flashAge = impactFlash.value ? now - impactFlash.value.startedAt : Infinity
  const shake = flashAge < 220 ? Math.sin(flashAge * 0.12) * (1 - flashAge / 220) * 4 : 0
  context.save()
  context.translate(shake, shake * 0.35)

  const topHalf = width * 0.19
  const bottomHalf = width * 0.345
  const laneGradient = context.createLinearGradient(0, laneTop, 0, laneBottom)
  laneGradient.addColorStop(0, '#20274c')
  laneGradient.addColorStop(0.45, '#17213d')
  laneGradient.addColorStop(1, '#25244b')

  context.beginPath()
  context.moveTo(centerX - topHalf - 12, laneTop)
  context.lineTo(centerX + topHalf + 12, laneTop)
  context.lineTo(centerX + bottomHalf + 14, laneBottom)
  context.lineTo(centerX - bottomHalf - 14, laneBottom)
  context.closePath()
  context.fillStyle = '#101426'
  context.fill()

  context.beginPath()
  context.moveTo(centerX - topHalf, laneTop)
  context.lineTo(centerX + topHalf, laneTop)
  context.lineTo(centerX + bottomHalf, laneBottom)
  context.lineTo(centerX - bottomHalf, laneBottom)
  context.closePath()
  context.shadowColor = '#4ae9ff'
  context.shadowBlur = 24
  context.fillStyle = laneGradient
  context.fill()
  context.shadowBlur = 0
  context.strokeStyle = 'rgba(89, 231, 255, 0.48)'
  context.lineWidth = 1.5
  context.stroke()

  context.save()
  context.clip()
  for (let line = -3; line <= 3; line += 1) {
    const nearX = centerX + line * width * 0.065
    const farX = centerX + line * width * 0.036
    context.strokeStyle = line === 0 ? 'rgba(104, 217, 255, 0.12)' : 'rgba(104, 217, 255, 0.055)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(farX, laneTop)
    context.lineTo(nearX, laneBottom)
    context.stroke()
  }
  for (let marker = 1; marker <= 6; marker += 1) {
    const y = laneTop + laneHeight * marker / 7
    const halfWidth = laneWidthAt(y)
    context.strokeStyle = 'rgba(176, 190, 255, 0.075)'
    context.beginPath()
    context.moveTo(centerX - halfWidth, y)
    context.lineTo(centerX + halfWidth, y)
    context.stroke()
  }

  const arrowY = laneTop + laneHeight * 0.58
  for (let arrow = -3; arrow <= 3; arrow += 1) {
    const x = centerX + arrow * width * 0.034
    context.fillStyle = arrow === 0 ? 'rgba(91, 233, 255, 0.5)' : 'rgba(184, 197, 255, 0.24)'
    context.beginPath()
    context.moveTo(x, arrowY + 8)
    context.lineTo(x - 4, arrowY - 2)
    context.lineTo(x + 4, arrowY - 2)
    context.closePath()
    context.fill()
  }
  context.restore()

  if (phase.value === 'ready') {
    context.setLineDash([5, 9])
    context.lineWidth = 1
    context.strokeStyle = 'rgba(87, 238, 255, 0.22)'
    context.beginPath()
    for (let index = 0; index <= 36; index += 1) {
      const progress = 0.15 + index / 36 * 0.78
      const position = getBallPosition(aim.value, hook.value, progress)
      const y = laneY(progress)
      const x = centerX + position.x * laneWidthAt(y)
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
    context.setLineDash([])
  }

  for (const point of trail.value) {
    const age = now - point.at
    if (age < 0 || age > 340) continue
    const y = laneY(point.progress)
    const x = centerX + point.x * laneWidthAt(y)
    const alpha = (1 - age / 340) * 0.4
    context.globalAlpha = alpha
    context.fillStyle = '#59eeff'
    context.shadowColor = '#59eeff'
    context.shadowBlur = 16
    context.beginPath()
    context.arc(x, y, 4 + alpha * 7, 0, Math.PI * 2)
    context.fill()
    context.shadowBlur = 0
  }
  context.globalAlpha = 1

  for (const pin of pins.value) {
    const position = PIN_LAYOUT[pin]
    const progress = (position.y + 1) / 2
    const y = laneY(progress)
    const x = centerX + position.x * laneWidthAt(y)
    const scale = 0.82 + (position.y - 0.55) * 0.55
    drawPin(context, x, y, scale, 0, 1, 7.5 * scale)
  }

  for (const fallen of fallenPins.value) {
    const elapsed = now - fallen.startAt
    if (elapsed < 0 || elapsed > 1200) continue
    const t = clamp(elapsed / 520, 0, 1)
    const eased = 1 - (1 - t) * (1 - t)
    const position = PIN_LAYOUT[fallen.id]
    const progress = (position.y + 1) / 2
    const y = laneY(progress) + Math.sin(t * Math.PI) * 5 + eased * 9
    const baseX = centerX + position.x * laneWidthAt(laneY(progress))
    const x = baseX + fallen.direction * (10 + fallen.energy * 17) * eased
    const alpha = elapsed > 760 ? clamp(1 - (elapsed - 760) / 440, 0, 1) : 1
    const scale = 0.82 + (position.y - 0.55) * 0.55
    drawPin(context, x, y, scale, fallen.direction * Math.PI * 0.47 * eased, alpha, 7.5 * scale)
  }

  if (impactFlash.value && flashAge < 620) {
    const y = laneY(impactFlash.value.progress)
    const x = centerX + impactFlash.value.x * laneWidthAt(y)
    const progress = flashAge / 620
    context.globalAlpha = 1 - progress
    context.strokeStyle = '#8df8ff'
    context.lineWidth = 2
    context.shadowColor = '#61edff'
    context.shadowBlur = 24
    context.beginPath()
    context.arc(x, y, 11 + progress * 56, 0, Math.PI * 2)
    context.stroke()
    context.fillStyle = '#fff'
    context.beginPath()
    context.arc(x, y, Math.max(0, 10 * (1 - progress)), 0, Math.PI * 2)
    context.fill()
    context.shadowBlur = 0
    context.globalAlpha = 1
  }

  const ballT = phase.value === 'rolling' || phase.value === 'result' ? ballProgress.value : 0
  const ballPosition = getBallPosition(aim.value, hook.value, ballT)
  const ballY = laneY(ballT)
  const ballX = centerX + ballPosition.x * laneWidthAt(ballY)
  const ballRadius = clamp(laneWidthAt(ballY) * 0.035, 10, 16)
  context.shadowColor = '#55efff'
  context.shadowBlur = 23
  const ballGradient = context.createRadialGradient(ballX - ballRadius * 0.34, ballY - ballRadius * 0.38, 1, ballX, ballY, ballRadius)
  ballGradient.addColorStop(0, '#ffffff')
  ballGradient.addColorStop(0.3, '#8ef8ff')
  ballGradient.addColorStop(1, '#3485ff')
  context.fillStyle = ballGradient
  context.beginPath()
  context.arc(ballX, ballY, ballRadius, 0, Math.PI * 2)
  context.fill()
  context.shadowBlur = 0

  context.restore()
}

function animate(now) {
  if (phase.value === 'rolling') {
    ballProgress.value = clamp((now - throwStartedAt) / 2200, 0, 1)
    const position = getBallPosition(aim.value, hook.value, ballProgress.value)
    trail.value.push({ x: position.x, progress: ballProgress.value, at: now })
    trail.value = trail.value.filter((point) => now - point.at < 340)
    if (ballProgress.value >= 1) finishThrow()
  }
  drawLane(now)
  fallenPins.value = fallenPins.value.filter((pin) => now - pin.startAt < 1200)
  animationFrame = requestAnimationFrame(animate)
}

function onKeydown(event) {
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    if (phase.value !== 'ready') return
    event.preventDefault()
    aim.value = clamp(aim.value + (event.code === 'ArrowLeft' ? -0.04 : 0.04), -1, 1)
  } else if (event.code === 'Space') {
    event.preventDefault()
    launch()
  } else if (event.code === 'Enter' && phase.value === 'result') {
    advance()
  } else if (event.code === 'Enter' && phase.value === 'gameover') {
    restartGame()
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
      <a class="wordmark" href="#" aria-label="Neon Bowl home">
        <span class="logo-mark">◉</span>
        <span>NEON BOWL</span>
      </a>
      <div class="topbar-right">
        <span class="arcade-tag"><i></i> ARCADE / SINGLE PLAYER</span>
        <button class="sound-button" :aria-pressed="soundEnabled" @click="toggleSound">
          {{ soundEnabled ? 'SOUND ON' : 'SOUND OFF' }}
        </button>
        <button class="restart-button" @click="restartGame">NEW GAME <span>↻</span></button>
      </div>
    </header>

    <section class="scorecard" aria-label="Bowling scorecard">
      <div class="scorecard-label">
        <span class="eyebrow">YOUR GAME</span>
        <strong>10 FRAME SCORECARD</strong>
      </div>
      <div class="frames-strip">
        <div
          v-for="(score, index) in scorecard"
          :key="index"
          class="frame-cell"
          :class="{ active: currentFrame === index && phase !== 'gameover' }"
        >
          <span class="frame-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="frame-marks">
            <span v-for="(mark, markIndex) in score.marks" :key="markIndex">{{ mark }}</span>
          </div>
          <strong>{{ score.cumulative ?? '·' }}</strong>
        </div>
      </div>
      <div class="score-total">
        <span>SCORE</span>
        <strong>{{ totalScore }}</strong>
      </div>
    </section>

    <section class="game-layout">
      <div class="lane-column">
        <div class="game-heading">
          <div>
            <p class="eyebrow">FRAME {{ String(Math.min(currentFrame + 1, 10)).padStart(2, '0') }} <span>·</span> BALL {{ phase === 'result' ? lastRoll.throw : throwNumber }}</p>
            <h1>Make it <span>count.</span></h1>
          </div>
          <div class="game-status" :class="{ rolling: phase === 'rolling' }">
            <i></i>{{ phase === 'rolling' ? 'BALL IN PLAY' : phase === 'gameover' ? 'GAME COMPLETE' : 'LANE READY' }}
          </div>
        </div>

        <div class="lane-frame">
          <canvas ref="canvas" class="lane-canvas" aria-label="Neon bowling lane with ball and pins"></canvas>
          <div class="lane-caption lane-caption-top"><span>PIN DECK</span><b>10</b></div>
          <div class="lane-caption lane-caption-bottom"><span>RELEASE</span><b>{{ phase === 'rolling' ? 'ROLLING' : 'READY' }}</b></div>
          <div v-if="phase === 'result' && ['STRIKE!', 'SPARE!', 'DOUBLE!'].includes(lastRoll.label)" class="lane-banner">
            {{ lastRoll.label }}
          </div>
        </div>

        <div class="lane-footnote">
          <span><b>←</b><b>→</b> AIM</span>
          <span><b>SPACE</b> ROLL</span>
          <span><b>ENTER</b> CONTINUE</span>
        </div>
      </div>

      <aside class="control-panel">
        <div class="roll-result" :class="{ celebration: phase === 'result' && ['STRIKE!', 'SPARE!', 'DOUBLE!'].includes(lastRoll.label) }">
          <span class="eyebrow">{{ phase === 'gameover' ? 'FINAL SCORE' : phase === 'result' ? `FRAME ${String(lastRoll.frame).padStart(2, '0')} / BALL ${lastRoll.throw}` : 'UP NEXT' }}</span>
          <h2>{{ phase === 'gameover' ? totalScore : phase === 'result' ? lastRoll.label : 'Your turn.' }}</h2>
          <p v-if="phase === 'result'">{{ lastRoll.pinsDown }} down <span>·</span> {{ lastRoll.pinsStanding }} standing</p>
          <p v-else-if="phase === 'gameover'">That’s a full game. Nice bowling.</p>
          <p v-else>Set your line and send it.</p>
        </div>

        <div class="shot-controls" :class="{ disabled: phase !== 'ready' }">
          <label class="control">
            <span class="control-title">AIM <b>{{ aim < -0.02 ? 'LEFT' : aim > 0.02 ? 'RIGHT' : 'CENTER' }}</b></span>
            <input v-model.number="aim" type="range" min="-1" max="1" step="0.01" :disabled="phase !== 'ready'" aria-label="Aim" />
          </label>
          <label class="control">
            <span class="control-title">POWER <b>{{ Math.round(power * 100) }}%</b></span>
            <input v-model.number="power" type="range" min="0.2" max="1" step="0.01" :disabled="phase !== 'ready'" aria-label="Power" />
          </label>
          <label class="control">
            <span class="control-title">HOOK <b>{{ hook < -0.02 ? 'LEFT' : hook > 0.02 ? 'RIGHT' : 'NONE' }}</b></span>
            <input v-model.number="hook" type="range" min="-1" max="1" step="0.01" :disabled="phase !== 'ready'" aria-label="Hook" />
          </label>
        </div>

        <div class="rack-status">
          <span>PINS STILL UP</span>
          <strong>{{ phase === 'result' ? lastRoll.pinsStanding : pins.length }}<small> / 10</small></strong>
        </div>

        <button v-if="phase === 'ready'" class="roll-button" @click="launch">
          <span>ROLL BALL</span><b>↗</b>
        </button>
        <button v-else-if="phase === 'rolling'" class="roll-button" disabled>
          <span>ROLLING…</span><b>◌</b>
        </button>
        <button v-else-if="phase === 'result'" class="roll-button" @click="advance">
          <span>{{ lastRoll.transition.gameOver ? 'FINAL SCORE' : lastRoll.transition.frameComplete ? 'NEXT FRAME' : lastRoll.transition.newRack ? 'BONUS BALL' : 'SECOND BALL' }}</span><b>↗</b>
        </button>
        <button v-else class="roll-button" @click="restartGame">
          <span>PLAY AGAIN</span><b>↻</b>
        </button>
        <p class="control-hint">{{ phase === 'ready' ? 'AIM. COMMIT. LET IT FLY.' : phase === 'rolling' ? 'WATCH THE LINE.' : phase === 'gameover' ? 'PERFECT GAME? RUN IT BACK.' : lastRoll.transition.frameComplete ? 'NEXT FRAME AWAITS.' : lastRoll.transition.newRack ? 'BONUS BALL READY.' : 'PICK UP WHAT’S LEFT.' }}</p>
      </aside>
    </section>

    <footer class="footer">
      <span>ONE MORE ROLL.</span>
      <span>NEON BOWL <b>·</b> FREE PLAY</span>
    </footer>
  </main>
</template>
