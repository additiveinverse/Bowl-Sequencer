import assert from 'node:assert/strict'
import test from 'node:test'
import { simulateThrow } from './bowling.js'

function bowl(overrides = {}) {
  return simulateThrow({
    standingPins: Array.from({ length: 10 }, (_, index) => index),
    aim: 0,
    power: 0.72,
    hook: 0,
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
  const result = bowl({ aim: 1, hook: 0 })

  assert.deepEqual(result.knockedPins, [])
  assert.equal(result.firstPinHit, null)
  assert.deepEqual(result.remainingPins, Array.from({ length: 10 }, (_, index) => index))
})

test('the same shot and rack produce identical collisions and trajectory', () => {
  const first = bowl()
  const second = bowl()

  assert.deepEqual(first, second)
  assert.equal(first.trajectory.length, 101)
})
