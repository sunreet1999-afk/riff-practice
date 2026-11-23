import { describe, expect, it } from 'vitest'
import { STRUCTURED_SLOTS, STRUCTURES, structureForSlot } from './structures'

describe('structure rotation', () => {
  it('labels the first 10 slots in the spec order', () => {
    expect(STRUCTURED_SLOTS).toBe(10)
    expect(Array.from({ length: STRUCTURED_SLOTS }, (_, i) => structureForSlot(i))).toEqual([
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

  it('uses every structure exactly once in the first 10 slots', () => {
    const labels = new Set(Array.from({ length: STRUCTURED_SLOTS }, (_, i) => structureForSlot(i)))
    expect(labels.size).toBe(STRUCTURES.length)
  })

  it('makes every line after the 10th a Free choice', () => {
    expect(structureForSlot(10)).toBe('Free choice')
    expect(structureForSlot(11)).toBe('Free choice')
    expect(structureForSlot(57)).toBe('Free choice')
    expect(structureForSlot(-1)).toBe('Free choice')
  })
})
