let audioContext
let rollNodes
let soundMuted = false

function getAudioContext() {
  if (soundMuted || typeof window === 'undefined' || !window.AudioContext) return null
  try {
    audioContext ||= new window.AudioContext()
  } catch (error) {
    console.error('Unable to initialize bowling audio.', error)
    return null
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch((error) => console.error('Unable to resume bowling audio.', error))
  }
  return audioContext
}

function makeNoise(context, duration) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1
  }
  return buffer
}

export function setSoundMuted(muted) {
  soundMuted = muted
  if (muted) stopRollSound()
}

export function startRollSound() {
  const context = getAudioContext()
  if (!context) return

  stopRollSound()
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  const now = context.currentTime
  source.buffer = makeNoise(context, 2.35)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(760, now)
  filter.frequency.exponentialRampToValueAtTime(280, now + 2.2)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.035, now + 0.16)
  gain.gain.setValueAtTime(0.025, now + 1.65)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3)
  source.connect(filter).connect(gain).connect(context.destination)
  source.start(now)
  source.stop(now + 2.35)
  rollNodes = { source, gain }
  source.onended = () => {
    if (rollNodes?.source === source) rollNodes = null
  }
}

export function stopRollSound() {
  if (!rollNodes || !audioContext) return
  const { source, gain } = rollNodes
  const now = audioContext.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setTargetAtTime(0.0001, now, 0.035)
  source.stop(now + 0.16)
  rollNodes = null
}

export function playPinImpact(pinCount) {
  const context = getAudioContext()
  if (!context || pinCount <= 0) return

  const now = context.currentTime
  const noise = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const noiseGain = context.createGain()
  noise.buffer = makeNoise(context, 0.24)
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(680 + pinCount * 75, now)
  filter.Q.setValueAtTime(0.8, now)
  noiseGain.gain.setValueAtTime(0.0001, now)
  noiseGain.gain.linearRampToValueAtTime(0.035 + pinCount * 0.006, now + 0.008)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  noise.connect(filter).connect(noiseGain).connect(context.destination)
  noise.start(now)
  noise.stop(now + 0.24)

  const thump = context.createOscillator()
  const thumpGain = context.createGain()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(92 + pinCount * 3, now)
  thump.frequency.exponentialRampToValueAtTime(38, now + 0.18)
  thumpGain.gain.setValueAtTime(0.055, now)
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
  thump.connect(thumpGain).connect(context.destination)
  thump.start(now)
  thump.stop(now + 0.22)
}
