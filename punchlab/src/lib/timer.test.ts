import { describe, expect, it } from 'vitest'
import { DEFAULT_DRILL_LENGTH, DRILL_LENGTHS, describeDrillLength, drillEndsAt, elapsedMs, formatClock, isExpired, parseDrillLength, remainingMs } from './timer'

describe('drill timer', () => {
  const start = 1_000_000

  it('offers 1, 2, 5, 10 minutes and no limit, defaulting to 5', () => {
    expect(DRILL_LENGTHS).toEqual([1, 2, 5, 10, 'unlimited'])
    expect(DEFAULT_DRILL_LENGTH).toBe(5)
    expect(drillEndsAt(start)).toBe(start + 300_000)
    expect(drillEndsAt(start, 1)).toBe(start + 60_000)
    expect(drillEndsAt(start, 10)).toBe(start + 600_000)
    expect(drillEndsAt(start, 'unlimited')).toBeNull()
  })

  it('parses stored choices, falling back to 5 for anything unknown', () => {
    expect(parseDrillLength('2')).toBe(2)
    expect(parseDrillLength('unlimited')).toBe('unlimited')
    expect(parseDrillLength('3')).toBe(5)
    expect(parseDrillLength(undefined)).toBe(5)
  })

  it('describes a session length, timed or unlimited', () => {
    expect(describeDrillLength({ startedAt: start, endsAt: drillEndsAt(start, 2) })).toBe('2 min')
    expect(describeDrillLength({ startedAt: start, endsAt: null, finishedAt: start + 192_000 })).toBe('no time limit, took 3:12')
    expect(describeDrillLength({ startedAt: start, endsAt: null })).toBe('no time limit')
    expect(describeDrillLength({ startedAt: start, plannedEndsAt: start + 300_000, endsAt: start + 450_000, finishedAt: start + 450_000 })).toBe(
      '5 min planned, extended, took 7:30 in total',
    )
    expect(describeDrillLength({ startedAt: start, plannedEndsAt: start + 300_000, endsAt: null, finishedAt: start + 552_000 })).toBe(
      '5 min planned, then no limit, took 9:12 in total',
    )
  })

  it('never expires an unlimited drill and counts its time up', () => {
    expect(isExpired(null, start + 10 * 3_600_000)).toBe(false)
    expect(elapsedMs(start, start + 65_000)).toBe(65_000)
    expect(elapsedMs(start, start - 5)).toBe(0)
  })

  it('counts down from wall clock time', () => {
    const end = drillEndsAt(start)!
    expect(remainingMs(end, start)).toBe(300_000)
    expect(remainingMs(end, start + 61_000)).toBe(239_000)
  })

  it('never goes negative and reports expiry', () => {
    const end = drillEndsAt(start)!
    expect(isExpired(end, end - 1)).toBe(false)
    expect(isExpired(end, end)).toBe(true)
    expect(remainingMs(end, end + 5_000)).toBe(0)
  })

  it('keeps counting while the tab is in the background', () => {
    const end = drillEndsAt(start)!
    // No ticks happen for 10 minutes; the next read is still correct.
    expect(isExpired(end, start + 600_000)).toBe(true)
  })

  it('formats as M:SS, rounding partial seconds up', () => {
    expect(formatClock(600_000)).toBe('10:00')
    expect(formatClock(300_000)).toBe('5:00')
    expect(formatClock(59_001)).toBe('1:00')
    expect(formatClock(59_000)).toBe('0:59')
    expect(formatClock(9_000)).toBe('0:09')
    expect(formatClock(1)).toBe('0:01')
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(-50)).toBe('0:00')
  })
})
