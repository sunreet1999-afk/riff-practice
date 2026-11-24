import type { DrillLine, Session } from '../types'

export type Extension = 1 | 2 | 5 | 'unlimited'
export const EXTENSIONS: readonly Extension[] = [1, 2, 5, 'unlimited']

/** The end time the user first chose, before any extension (null = no limit from the start). */
export function plannedEnd(session: Pick<Session, 'endsAt' | 'plannedEndsAt'>): number | null {
  return session.plannedEndsAt !== undefined ? session.plannedEndsAt : session.endsAt
}

/** New end time after the user extends at `now`; time spent deciding doesn't count. */
export function extendedEndsAt(now: number, extension: Extension): number | null {
  return extension === 'unlimited' ? null : now + extension * 60_000
}

export interface JokeCount {
  /** Lines with text. */
  total: number
  /** Written within the originally planned time. */
  planned: number
  /** Written after the drill was extended. */
  extra: number
}

/** Counts written lines (jokes), split into planned time and extra time. Older lines without a timestamp count as planned. */
export function countJokes(session: Pick<Session, 'lines' | 'startedAt' | 'endsAt' | 'plannedEndsAt'>): JokeCount {
  const written = session.lines.filter((l: DrillLine) => l.text)
  const end = plannedEnd(session)
  if (!wasExtended(session) || end === null) return { total: written.length, planned: written.length, extra: 0 }
  const limit = end - session.startedAt
  const extra = written.filter((l) => l.at !== undefined && l.at > limit).length
  return { total: written.length, planned: written.length - extra, extra }
}

/** True when the drill ran past the time first chosen. */
export function wasExtended(session: Pick<Session, 'endsAt' | 'plannedEndsAt'>): boolean {
  return session.plannedEndsAt !== undefined && session.plannedEndsAt !== session.endsAt
}

/** Jokes per minute over the time actually spent, rounded to one decimal; null if unknown. */
export function jokesPerMinute(session: Pick<Session, 'lines' | 'startedAt' | 'finishedAt'>): number | null {
  if (!session.finishedAt) return null
  const minutes = (session.finishedAt - session.startedAt) / 60_000
  if (minutes <= 0) return null
  const total = session.lines.filter((l) => l.text).length
  return Math.round((total / minutes) * 10) / 10
}

export function jokesLabel(n: number): string {
  return `${n} joke${n === 1 ? '' : 's'}`
}
