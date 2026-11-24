import { formatDuration } from './format'

/** Drill lengths the user can pick: minutes, or no time limit. */
export const DRILL_LENGTHS = [1, 2, 5, 10, 'unlimited'] as const
export type DrillLength = (typeof DRILL_LENGTHS)[number]
export const DEFAULT_DRILL_LENGTH: DrillLength = 5

export function isDrillLength(value: unknown): value is DrillLength {
  return DRILL_LENGTHS.includes(value as DrillLength)
}

/** Parses a stored setting ("5", "unlimited"), falling back to the default. */
export function parseDrillLength(raw: string | undefined): DrillLength {
  if (raw === 'unlimited') return 'unlimited'
  const n = Number(raw)
  return isDrillLength(n) ? n : DEFAULT_DRILL_LENGTH
}

/** End time for a drill started at `startedAt`, or null when there is no time limit. */
export function drillEndsAt(startedAt: number, length: DrillLength = DEFAULT_DRILL_LENGTH): number | null {
  return length === 'unlimited' ? null : startedAt + length * 60_000
}

/** Human description of a session's drill length, e.g. "5 min" or "no time limit, took 3:12". */
export function describeDrillLength(session: { startedAt: number; endsAt: number | null; finishedAt?: number }): string {
  if (session.endsAt === null) {
    const took = session.finishedAt ? `, took ${formatDuration(session.finishedAt - session.startedAt)}` : ''
    return `no time limit${took}`
  }
  return `${Math.round((session.endsAt - session.startedAt) / 60_000)} min`
}

/** Milliseconds left, never negative. Based on wall clock so backgrounding the tab can't pause it. */
export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now)
}

/** True once a timed drill's time is up; an unlimited drill (endsAt null) never expires. */
export function isExpired(endsAt: number | null, now: number): boolean {
  return endsAt !== null && remainingMs(endsAt, now) === 0
}

/** Time spent so far, for unlimited drills that count up. */
export function elapsedMs(startedAt: number, now: number): number {
  return Math.max(0, now - startedAt)
}

/** Formats as M:SS, rounding up so the display shows 0:00 only when time is really up. */
export function formatClock(ms: number): string {
  const totalSec = Math.ceil(Math.max(0, ms) / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
