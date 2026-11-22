import assert from 'node:assert/strict'
import test from 'node:test'
import { generatePattern } from './pattern.js'

test('identical remaining-pin states produce the same deterministic pattern', () => {
  const first = generatePattern([0, 3, 5, 7], 0.72)
  const second = generatePattern([0, 3, 5, 7], 0.72)

  assert.equal(first.seed, second.seed)
  assert.equal(first.pattern, second.pattern)
  assert.deepEqual(first.velocityMap, second.velocityMap)
  assert.deepEqual(first.accentMap, second.accentMap)
})

test('an empty pin mask remains distinct from the one-pin mask', () => {
  const emptyRack = generatePattern([], 0.72)
  const onePin = generatePattern([0], 0.72)

  assert.equal(emptyRack.seed, 0)
  assert.notEqual(emptyRack.pattern, onePin.pattern)
})

test('generates three 16-step drum rows and performance maps', () => {
  const generated = generatePattern([1, 4, 8], 0.72)

  assert.deepEqual(Object.values(generated.drums).map((row) => row.length), [16, 16, 16])
  assert.equal(generated.velocityMap.length, 16)
  assert.equal(generated.accentMap.length, 16)
})
