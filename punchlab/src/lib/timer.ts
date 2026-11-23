export const DRILL_DURATION_MS = 5 * 60 * 1000

/** End time for a drill started at `startedAt`. */
export function drillEndsAt(startedAt: number, durationMs: number = DRILL_DURATION_MS): number {
  return startedAt + durationMs
}

/** Milliseconds left, never negative. Based on wall clock so backgrounding the tab can't pause it. */
export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now)
}

export function isExpired(endsAt: number, now: number): boolean {
  return remainingMs(endsAt, now) === 0
}

/** Formats as M:SS, rounding up so the display shows 0:00 only when time is really up. */
export function formatClock(ms: number): string {
  const totalSec = Math.ceil(Math.max(0, ms) / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
