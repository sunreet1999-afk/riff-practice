import { describe, expect, it } from 'vitest'
import { isoWeek, structureOfWeek, WEEKLY_STRUCTURES } from './week'

describe('isoWeek', () => {
  it('matches known ISO weeks, including year boundaries', () => {
    expect(isoWeek(new Date(2026, 0, 1))).toEqual({ year: 2026, week: 1 }) // Thursday
    expect(isoWeek(new Date(2026, 10, 23))).toEqual({ year: 2026, week: 48 })
    expect(isoWeek(new Date(2027, 0, 1))).toEqual({ year: 2026, week: 53 }) // Friday belongs to last year's week
    expect(isoWeek(new Date(2027, 0, 4))).toEqual({ year: 2027, week: 1 })
    expect(isoWeek(new Date(2024, 11, 30))).toEqual({ year: 2025, week: 1 }) // Monday belongs to next year
  })
})

describe('structureOfWeek', () => {
  it('excludes Free choice and has 9 structures', () => {
    expect(WEEKLY_STRUCTURES).toHaveLength(9)
    expect(WEEKLY_STRUCTURES).not.toContain('Free choice')
  })

  it('stays the same Monday through Sunday', () => {
    const monday = structureOfWeek(new Date(2026, 10, 23, 0, 1))
    for (let d = 23; d <= 29; d++) expect(structureOfWeek(new Date(2026, 10, d, 23, 59))).toBe(monday)
  })

  it('changes the next Monday and cycles through all 9 in 9 weeks', () => {
    const seen = Array.from({ length: 9 }, (_, i) => structureOfWeek(new Date(2026, 10, 23 + i * 7)))
    expect(new Set(seen).size).toBe(9)
    expect(seen[1]).not.toBe(seen[0])
    expect(structureOfWeek(new Date(2026, 10, 23 + 63))).toBe(seen[0])
  })

  it('does not jump at a year boundary', () => {
    // Mon 28 Dec 2026 and Mon 4 Jan 2027 are consecutive ISO weeks; they should be consecutive in the rotation.
    const a = WEEKLY_STRUCTURES.indexOf(structureOfWeek(new Date(2026, 11, 28)))
    const b = WEEKLY_STRUCTURES.indexOf(structureOfWeek(new Date(2027, 0, 4)))
    expect(b).toBe((a + 1) % 9)
  })
})
