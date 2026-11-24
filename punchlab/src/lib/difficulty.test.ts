import { describe, expect, it } from 'vitest'
import type { Session } from '../types'
import { plannedPace, suggestDifficulty } from './difficulty'

const start = 1_000_000
function drill(jokes: number, minutes: number | null): Session {
  return {
    promptId: 1,
    dateKey: '2026-11-24',
    status: 'drilled',
    startedAt: start,
    endsAt: minutes === null ? null : start + minutes * 60_000,
    finishedAt: start + 300_000,
    lines: Array.from({ length: jokes }, (_, slot) => ({ slot, structure: '', text: `j${slot}`, at: 1000 })),
    picks: [],
  }
}

describe('plannedPace', () => {
  it('is jokes per planned minute, and null for no-limit drills', () => {
    expect(plannedPace(drill(10, 5))).toBe(2)
    expect(plannedPace(drill(10, null))).toBeNull()
  })
})

describe('suggestDifficulty', () => {
  it('needs at least one timed drill', () => {
    expect(suggestDifficulty([])).toBeNull()
    expect(suggestDifficulty([drill(9, null)])).toBeNull()
  })

  it('suggests easy when stalling, tough when writing fast, medium in between', () => {
    expect(suggestDifficulty([drill(2, 5), drill(3, 5)])).toEqual({ difficulty: 'easy', pace: 0.5, drills: 2 })
    expect(suggestDifficulty([drill(12, 5), drill(10, 5)])).toEqual({ difficulty: 'tough', pace: 2.2, drills: 2 })
    expect(suggestDifficulty([drill(6, 5)])).toEqual({ difficulty: 'medium', pace: 1.2, drills: 1 })
  })

  it('uses only the 3 newest timed drills', () => {
    const recent = [drill(10, 5), drill(10, 5), drill(10, 5), drill(0, 5), drill(0, 5)]
    expect(suggestDifficulty(recent)?.difficulty).toBe('tough')
  })
})
