function getMark(roll, spare = false) {
  if (spare) return '/'
  return roll === 10 ? 'X' : roll === 0 ? '–' : String(roll)
}

function getFrameMarks(frameIndex, rolls) {
  if (frameIndex < 9) {
    if (!rolls.length) return []
    if (rolls[0] === 10) return ['X']
    if (rolls.length < 2) return [getMark(rolls[0])]
    return [getMark(rolls[0]), getMark(rolls[1], rolls[0] + rolls[1] === 10)]
  }

  return rolls.map((roll, index) => {
    if (roll === 10) return 'X'
    if (index === 0 || !rolls[index - 1]) return getMark(roll)
    if (index === 1 && rolls[0] < 10 && rolls[0] + roll === 10) return '/'
    if (index === 2 && rolls[0] === 10 && rolls[1] < 10 && rolls[1] + roll === 10) return '/'
    return getMark(roll)
  })
}

export function getFrameTransition(frameIndex, rolls) {
  if (frameIndex < 9) {
    const frameComplete = rolls[0] === 10 || rolls.length === 2
    return {
      frameComplete,
      newRack: frameComplete,
      gameOver: false,
    }
  }

  if (rolls.length === 1) {
    return { frameComplete: false, newRack: rolls[0] === 10, gameOver: false }
  }

  if (rolls.length === 2) {
    if (rolls[0] === 10) {
      return { frameComplete: false, newRack: rolls[1] === 10, gameOver: false }
    }

    const spare = rolls[0] + rolls[1] === 10
    return { frameComplete: !spare, newRack: spare, gameOver: !spare }
  }

  return { frameComplete: true, newRack: false, gameOver: true }
}

export function getScorecard(frames) {
  const allRolls = frames.flatMap((frame) => frame.rolls)
  let rollOffset = 0
  let runningTotal = 0
  let totalResolved = true

  return frames.map((frame, frameIndex) => {
    const rolls = frame.rolls
    let score = null

    if (frameIndex < 9 && rolls.length) {
      if (rolls[0] === 10 && allRolls.length >= rollOffset + 3) {
        score = 10 + allRolls[rollOffset + 1] + allRolls[rollOffset + 2]
      } else if (rolls[0] !== 10 && rolls.length >= 2) {
        if (rolls[0] + rolls[1] === 10) {
          if (allRolls.length >= rollOffset + 3) score = 10 + allRolls[rollOffset + 2]
        } else {
          score = rolls[0] + rolls[1]
        }
      }
    } else if (frameIndex === 9 && frame.complete) {
      score = rolls.reduce((sum, roll) => sum + roll, 0)
    }

    if (score === null) {
      totalResolved = false
    } else if (totalResolved) {
      runningTotal += score
    }

    const result = {
      marks: getFrameMarks(frameIndex, rolls),
      score,
      cumulative: totalResolved ? runningTotal : null,
    }
    rollOffset += rolls.length
    return result
  })
}
