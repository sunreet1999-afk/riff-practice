/** Local-timezone calendar day as YYYY-MM-DD. */
export function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function previousDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d - 1))
}

/**
 * Consecutive days with at least one completed drill, ending today.
 * If today has no drill yet, a run ending yesterday still counts (the streak is not broken until the day ends).
 */
export function computeStreak(completedDayKeys: Iterable<string>, today: Date): number {
  const days = new Set(completedDayKeys)
  let cursor = localDateKey(today)
  if (!days.has(cursor)) cursor = previousDay(cursor)
  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor = previousDay(cursor)
  }
  return streak
}
