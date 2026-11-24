import { countJokes, plannedEnd } from './drillStats'
import type { Difficulty } from './ideaPrompt'
import type { Session } from '../types'

/**
 * Rough thresholds, in jokes per minute of planned drill time. They are a
 * starting guess, not a research number: the idea (from "desirable
 * difficulty" and the 85% rule) is to keep practice hard but doable.
 */
export const EASY_BELOW = 0.8
export const TOUGH_FROM = 2

export interface DifficultySuggestion {
  difficulty: Difficulty
  /** Average jokes per minute over the drills used, one decimal. */
  pace: number
  drills: number
}

/** Pace (planned-time jokes per planned minute) of one timed drill; null for no-limit drills. */
export function plannedPace(session: Session): number | null {
  const end = plannedEnd(session)
  if (end === null) return null
  const minutes = (end - session.startedAt) / 60_000
  if (minutes <= 0) return null
  return countJokes(session).planned / minutes
}

/**
 * Suggests a prompt difficulty from the last few timed drills (newest first):
 * writing fast → go tougher; stalling → go easier. Null until there's a drill to go on.
 */
export function suggestDifficulty(recent: Session[], take = 3): DifficultySuggestion | null {
  const paces = recent.map(plannedPace).filter((p): p is number => p !== null).slice(0, take)
  if (paces.length === 0) return null
  const pace = Math.round((paces.reduce((a, b) => a + b, 0) / paces.length) * 10) / 10
  const difficulty: Difficulty = pace < EASY_BELOW ? 'easy' : pace >= TOUGH_FROM ? 'tough' : 'medium'
  return { difficulty, pace, drills: paces.length }
}
