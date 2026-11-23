import assert from 'node:assert/strict'
import test from 'node:test'
import { getBallPosition, getBallRotation, simulateThrow } from './bowling.js'

function bowl(overrides = {}) {
  return simulateThrow({
    standingPins: Array.from({ length: 10 }, (_, index) => index),
    aim: 0,
    power: 0.72,
    spin: 0,
    ...overrides,
  })
}

test('a centered high-power shot can clear the full rack', () => {
  const result = bowl({ power: 1 })

  assert.equal(result.knockedPins.length, 10)
  assert.deepEqual(result.remainingPins, [])
  assert.equal(result.firstPinHit, 0)
})

test('a shot outside the pin deck misses and preserves the rack', () => {
  const result = bowl({ aim: 1, spin: 0 })

  assert.deepEqual(result.knockedPins, [])
  assert.equal(result.firstPinHit, null)
  assert.equal(result.gutter, false)
  assert.deepEqual(result.remainingPins, Array.from({ length: 10 }, (_, index) => index))
})

test('a shot that leaves the lane is identified as a gutter ball', () => {
  const result = bowl({ aim: 1, spin: 1 })

  assert.deepEqual(result.knockedPins, [])
  assert.equal(result.gutter, true)
})

test('the same shot and rack produce identical collisions and trajectory', () => {
  const first = bowl()
  const second = bowl()

  assert.deepEqual(first, second)
  assert.equal(first.trajectory.length, 101)
})

test('spin creates a late hook in the direction of rotation', () => {
  const early = getBallPosition(0, 1, 0.7, 0.2)
  const straight = getBallPosition(0, 0, 0.7, 0.95)
  const rightSpin = getBallPosition(0, 1, 0.7, 0.95)
  const leftSpin = getBallPosition(0, -1, 0.7, 0.95)

  assert.ok(Math.abs(early.x) < 0.001)
  assert.equal(straight.x, 0)
  assert.ok(rightSpin.x > 0)
  assert.ok(leftSpin.x < 0)
})

test('lower speed lets the same spin hook farther', () => {
  const slow = getBallPosition(0, 1, 0.25, 1)
  const fast = getBallPosition(0, 1, 0.95, 1)

  assert.ok(slow.x > fast.x)
})

test('ball rotation advances during a throw and responds to spin', () => {
  assert.equal(getBallRotation(0, 0), 0)
  assert.ok(getBallRotation(1, 1) > getBallRotation(0, 1))
  assert.ok(getBallRotation(-1, 1) < getBallRotation(0, 1))
})
