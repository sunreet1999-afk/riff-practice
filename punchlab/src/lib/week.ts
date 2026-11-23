import { STRUCTURES, type Structure } from './structures'

/** Structures that rotate weekly. "Free choice" is excluded: it has no technique to teach. */
export const WEEKLY_STRUCTURES: readonly Structure[] = STRUCTURES.filter((s) => s !== 'Free choice')

const DAY_MS = 86_400_000

/** Monday of the ISO week containing `date`, as a UTC midnight timestamp of the local calendar day. */
function isoMondayUtc(date: Date): number {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = (new Date(day).getUTCDay() + 6) % 7 // Monday = 0
  return day - weekday * DAY_MS
}

/** ISO-8601 week-numbering year and week (weeks start Monday; week 1 contains the first Thursday). */
export function isoWeek(date: Date): { year: number; week: number } {
  const thursday = new Date(isoMondayUtc(date) + 3 * DAY_MS)
  const year = thursday.getUTCFullYear()
  const week = Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / (7 * DAY_MS)) + 1
  return { year, week }
}

/** Continuous week count since the Monday 1970-01-05, so the rotation never resets at year boundaries. */
function weekIndex(date: Date): number {
  return Math.floor((isoMondayUtc(date) - Date.UTC(1970, 0, 5)) / (7 * DAY_MS))
}

/** The highlighted structure for the ISO week containing `date`. Same for every user. */
export function structureOfWeek(date: Date): Structure {
  const n = WEEKLY_STRUCTURES.length
  return WEEKLY_STRUCTURES[((weekIndex(date) % n) + n) % n]
}
