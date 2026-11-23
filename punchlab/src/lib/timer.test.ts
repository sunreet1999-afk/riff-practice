import { describe, expect, it } from 'vitest'
import { DRILL_DURATION_MS, drillEndsAt, formatClock, isExpired, remainingMs } from './timer'

describe('drill timer', () => {
  const start = 1_000_000

  it('lasts exactly 5 minutes', () => {
    expect(DRILL_DURATION_MS).toBe(300_000)
    expect(drillEndsAt(start)).toBe(start + 300_000)
  })

  it('counts down from wall clock time', () => {
    const end = drillEndsAt(start)
    expect(remainingMs(end, start)).toBe(300_000)
    expect(remainingMs(end, start + 61_000)).toBe(239_000)
  })

  it('never goes negative and reports expiry', () => {
    const end = drillEndsAt(start)
    expect(isExpired(end, end - 1)).toBe(false)
    expect(isExpired(end, end)).toBe(true)
    expect(remainingMs(end, end + 5_000)).toBe(0)
  })

  it('keeps counting while the tab is in the background', () => {
    const end = drillEndsAt(start)
    // No ticks happen for 10 minutes; the next read is still correct.
    expect(isExpired(end, start + 600_000)).toBe(true)
  })

  it('formats as M:SS, rounding partial seconds up', () => {
    expect(formatClock(300_000)).toBe('5:00')
    expect(formatClock(59_001)).toBe('1:00')
    expect(formatClock(59_000)).toBe('0:59')
    expect(formatClock(9_000)).toBe('0:09')
    expect(formatClock(1)).toBe('0:01')
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(-50)).toBe('0:00')
  })
})
