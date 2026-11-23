import { describe, expect, it } from 'vitest'
import { SLOT_COUNT, STRUCTURES, structureForSlot } from './structures'

describe('structure rotation', () => {
  it('has 10 slots with the spec order', () => {
    expect(SLOT_COUNT).toBe(10)
    expect(Array.from({ length: SLOT_COUNT }, (_, i) => structureForSlot(i))).toEqual([
      'Exaggeration',
      'Reversal',
      'Literal interpretation',
      'Comparison',
      'Dialogue',
      'Callback',
      'Wordplay',
      'Misdirection',
      'Specific detail',
      'Free choice',
    ])
  })

  it('uses every structure exactly once in 10 slots', () => {
    const labels = new Set(Array.from({ length: SLOT_COUNT }, (_, i) => structureForSlot(i)))
    expect(labels.size).toBe(STRUCTURES.length)
  })

  it('wraps around after the last structure', () => {
    expect(structureForSlot(10)).toBe('Exaggeration')
    expect(structureForSlot(13)).toBe('Comparison')
    expect(structureForSlot(-1)).toBe('Free choice')
  })
})
