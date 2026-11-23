const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

export function formatDay(ms: number): string {
  return dayFormat.format(ms)
}

export function formatTime(ms: number): string {
  return timeFormat.format(ms)
}

/** Duration as M:SS. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}

/** Mean of numbers rounded to one decimal, or null for an empty list. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}
