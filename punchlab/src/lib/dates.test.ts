import { describe, expect, it } from 'vitest'
import { computeStreak, localDateKey } from './dates'

describe('localDateKey', () => {
  it('uses the local calendar day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('computeStreak', () => {
  const today = new Date(2026, 2, 1, 10) // 1 March 2026

  it('is 0 with no drills', () => {
    expect(computeStreak([], today)).toBe(0)
  })

  it('counts consecutive days ending today, across a month boundary', () => {
    expect(computeStreak(['2026-03-01', '2026-02-28', '2026-02-27', '2026-02-25'], today)).toBe(3)
  })

  it('keeps a streak ending yesterday alive until today ends', () => {
    expect(computeStreak(['2026-02-28', '2026-02-27'], today)).toBe(2)
  })

  it('resets after a missed day', () => {
    expect(computeStreak(['2026-02-27'], today)).toBe(0)
  })

  it('counts multiple drills on one day once', () => {
    expect(computeStreak(['2026-03-01', '2026-03-01'], today)).toBe(1)
  })
})
