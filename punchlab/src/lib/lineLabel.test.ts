import { describe, expect, it } from 'vitest'
import { lineLabel } from './lineLabel'

describe('lineLabel', () => {
  it('shows a plain line number for new, unlabelled lines', () => {
    expect(lineLabel({ slot: 0, structure: '', text: 'x' })).toBe('Line 1')
  })

  it('keeps the structure label on lines from older drills', () => {
    expect(lineLabel({ slot: 3, structure: 'Comparison', text: 'x' })).toBe('4. Comparison')
  })
})
