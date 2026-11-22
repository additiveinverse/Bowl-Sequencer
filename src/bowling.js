export const PIN_LAYOUT = [
  { id: 0, x: 0, y: 0.55 },
  { id: 1, x: -0.05, y: 0.63 }, { id: 2, x: 0.05, y: 0.63 },
  { id: 3, x: -0.1, y: 0.71 }, { id: 4, x: 0, y: 0.71 }, { id: 5, x: 0.1, y: 0.71 },
  { id: 6, x: -0.15, y: 0.79 }, { id: 7, x: -0.05, y: 0.79 },
  { id: 8, x: 0.05, y: 0.79 }, { id: 9, x: 0.15, y: 0.79 },
]

const TRAJECTORY_SAMPLES = 101
const BALL_PIN_RADIUS = 0.047
const PIN_CONTACT_RADIUS = 0.14
const KNOCKDOWN_THRESHOLD = 0.1

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function getBallPosition(aim, hook, progress) {
  const t = clamp(progress, 0, 1)
  return {
    x: clamp(aim * 0.4 + hook * 0.15 * t * t, -0.5, 0.5),
    y: -1 + 2 * t,
  }
}

function getPinDistance(position, pin) {
  return Math.hypot(position.x - pin.x, position.y - pin.y)
}

export function simulateThrow({ standingPins, aim, power, hook }) {
  const trajectory = Array.from({ length: TRAJECTORY_SAMPLES }, (_, index) => {
    const progress = index / (TRAJECTORY_SAMPLES - 1)
    const point = getBallPosition(aim, hook, progress)
    return {
      x: Number(point.x.toFixed(3)),
      y: Number(point.y.toFixed(3)),
    }
  })
  const pins = standingPins
    .map((id) => PIN_LAYOUT[id])
    .sort((a, b) => a.y - b.y || a.x - b.x)
  const energies = new Map(pins.map((pin) => [pin.id, 0]))
  const directHits = new Map()

  for (const pin of pins) {
    let closestDistance = Infinity
    let contactProgress = null

    trajectory.forEach((point, index) => {
      const distance = getPinDistance(point, pin)
      if (distance < closestDistance) {
        closestDistance = distance
        contactProgress = index / (TRAJECTORY_SAMPLES - 1)
      }
    })

    if (closestDistance <= BALL_PIN_RADIUS) {
      const energy = power * (1 - closestDistance / BALL_PIN_RADIUS)
      energies.set(pin.id, energy)
      directHits.set(pin.id, contactProgress)
    }
  }

  for (const pin of pins) {
    const energy = energies.get(pin.id)
    if (energy < KNOCKDOWN_THRESHOLD) continue

    for (const downstreamPin of pins) {
      const depth = downstreamPin.y - pin.y
      if (depth <= 0 || depth > 0.1) continue

      const distance = Math.hypot(downstreamPin.x - pin.x, depth)
      if (distance >= PIN_CONTACT_RADIUS) continue

      const transferredEnergy = energy * 0.95 * (1 - distance / (PIN_CONTACT_RADIUS + 0.08))
      if (transferredEnergy > energies.get(downstreamPin.id)) {
        energies.set(downstreamPin.id, transferredEnergy)
      }
    }
  }

  const knockedPins = pins
    .filter((pin) => energies.get(pin.id) >= KNOCKDOWN_THRESHOLD)
    .map((pin) => pin.id)
  const pinfall = knockedPins.map((id) => ({ id, energy: energies.get(id) }))
  const remainingPins = standingPins.filter((pin) => !knockedPins.includes(pin))
  const firstHit = [...directHits.entries()].sort((a, b) => a[1] - b[1])[0]
  const impactProgress = firstHit ? firstHit[1] : 1
  const impactPosition = getBallPosition(aim, hook, impactProgress)

  return {
    knockedPins,
    pinfall,
    remainingPins,
    trajectory,
    impactX: impactPosition.x,
    impactY: impactProgress,
    firstPinHit: firstHit ? firstHit[0] : null,
    gutter: trajectory.some((point) => Math.abs(point.x) > 0.46),
  }
}
