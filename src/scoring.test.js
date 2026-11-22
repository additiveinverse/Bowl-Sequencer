import assert from 'node:assert/strict'
import test from 'node:test'
import { getFrameTransition, getScorecard } from './scoring.js'

function framesWith(...playedFrames) {
  return Array.from({ length: 10 }, (_, index) => ({
    rolls: playedFrames[index] || [],
    complete: index < playedFrames.length - 1,
  }))
}

test('spare score waits for and includes the next roll', () => {
  const scorecard = getScorecard(framesWith([7, 3], [4, 2]))

  assert.equal(scorecard[0].score, 14)
  assert.equal(scorecard[0].cumulative, 14)
  assert.equal(scorecard[1].cumulative, 20)
  assert.deepEqual(scorecard[0].marks, ['7', '/'])
})

test('strike score includes the next two rolls', () => {
  const scorecard = getScorecard(framesWith([10], [3, 5]))

  assert.equal(scorecard[0].score, 18)
  assert.equal(scorecard[1].cumulative, 26)
  assert.deepEqual(scorecard[0].marks, ['X'])
})

test('tenth-frame bonus racks reset only after a strike or spare', () => {
  assert.deepEqual(getFrameTransition(9, [10]), {
    frameComplete: false,
    newRack: true,
    gameOver: false,
  })
  assert.deepEqual(getFrameTransition(9, [10, 7]), {
    frameComplete: false,
    newRack: false,
    gameOver: false,
  })
  assert.deepEqual(getFrameTransition(9, [10, 10]), {
    frameComplete: false,
    newRack: true,
    gameOver: false,
  })
  assert.deepEqual(getFrameTransition(9, [7, 3]), {
    frameComplete: false,
    newRack: true,
    gameOver: false,
  })
  assert.deepEqual(getFrameTransition(9, [7, 2]), {
    frameComplete: true,
    newRack: false,
    gameOver: true,
  })
})

test('tenth-frame score includes earned bonus rolls', () => {
  const frames = framesWith(...Array.from({ length: 9 }, () => [10]))
  frames[9] = { rolls: [10, 10, 8], complete: true }

  const scorecard = getScorecard(frames)
  assert.equal(scorecard[9].score, 28)
  assert.equal(scorecard[9].cumulative, 298)
  assert.deepEqual(scorecard[9].marks, ['X', 'X', '8'])
})

test('a perfect game totals 300', () => {
  const frames = framesWith(...Array.from({ length: 9 }, () => [10]))
  frames[9] = { rolls: [10, 10, 10], complete: true }

  const scorecard = getScorecard(frames)
  assert.equal(scorecard[9].score, 30)
  assert.equal(scorecard[9].cumulative, 300)
})

test('a tenth-frame spare earns a fresh bonus rack', () => {
  const frames = framesWith(...Array.from({ length: 9 }, () => [0, 0]))
  frames[9] = { rolls: [7, 3, 10], complete: true }

  const result = getScorecard(frames)[9]
  assert.equal(result.score, 20)
  assert.deepEqual(result.marks, ['7', '/', 'X'])
})

test('a strike in the tenth frame can earn a spare on its second rack', () => {
  const frames = framesWith(...Array.from({ length: 9 }, () => [0, 0]))
  frames[9] = { rolls: [10, 7, 3], complete: true }

  const result = getScorecard(frames)[9]
  assert.equal(result.score, 20)
  assert.deepEqual(result.marks, ['X', '7', '/'])
})
