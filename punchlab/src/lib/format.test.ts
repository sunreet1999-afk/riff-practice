import { describe, expect, it } from 'vitest'
import { average, formatDuration } from './format'

describe('formatDuration', () => {
  it('formats as M:SS', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(192_400)).toBe('3:12')
    expect(formatDuration(300_000)).toBe('5:00')
  })
})

describe('average', () => {
  it('rounds to one decimal and handles empty lists', () => {
    expect(average([4, 3])).toBe(3.5)
    expect(average([5, 4, 4])).toBe(4.3)
    expect(average([])).toBeNull()
  })
})
