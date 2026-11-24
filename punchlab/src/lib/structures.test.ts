import { describe, expect, it } from 'vitest'
import { STRUCTURES } from './structures'

describe('STRUCTURES', () => {
  it('lists the 10 structures in the spec order', () => {
    expect(STRUCTURES).toEqual([
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
})
