export function generatePattern(remainingPins, impactEnergy) {
  const seed = remainingPins.reduce((value, pin) => value | (1 << (9 - pin)), 0)
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }

  const kick = []
  const snare = []
  const hat = []
  const velocityMap = []
  const accentMap = []

  for (let step = 0; step < 16; step += 1) {
    const kickHit = step % 4 === 0 || random() < 0.12
    const snareHit = step === 4 || step === 12 || random() < 0.09
    const hatHit = step % 2 === 0 || random() < 0.16
    kick.push(kickHit ? 'x' : '-')
    snare.push(snareHit ? 'x' : '-')
    hat.push(hatHit ? 'x' : '-')

    const active = kickHit || snareHit || hatHit
    const accent = active && random() < impactEnergy * 0.45
    velocityMap.push(active ? Math.round(68 + random() * 45 + impactEnergy * 14) : 0)
    accentMap.push(accent ? 1 : 0)
  }

  return {
    seed,
    pattern: `K ${kick.join('')}\nS ${snare.join('')}\nH ${hat.join('')}`,
    drums: { kick, snare, hat },
    velocityMap,
    accentMap,
  }
}
