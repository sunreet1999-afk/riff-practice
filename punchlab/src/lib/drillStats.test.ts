import { describe, expect, it } from 'vitest'
import type { DrillLine } from '../types'
import { countJokes, extendedEndsAt, jokesLabel, jokesPerMinute, plannedEnd, wasExtended } from './drillStats'

const start = 1_000_000
const line = (slot: number, text: string, at?: number): DrillLine => ({ slot, structure: '', text, at })

describe('extendedEndsAt', () => {
  it('adds the chosen minutes from the moment of choosing, or removes the limit', () => {
    expect(extendedEndsAt(start, 1)).toBe(start + 60_000)
    expect(extendedEndsAt(start, 5)).toBe(start + 300_000)
    expect(extendedEndsAt(start, 'unlimited')).toBeNull()
  })
})

describe('countJokes', () => {
  const lines = [line(0, 'a', 30_000), line(1, '', 60_000), line(2, 'b', 299_000), line(3, 'c', 330_000), line(4, 'd', 400_000)]

  it('counts written lines only', () => {
    expect(countJokes({ lines, startedAt: start, endsAt: start + 600_000 }).total).toBe(4)
  })

  it('splits jokes into planned time and extra time after an extension', () => {
    const extended = { lines, startedAt: start, endsAt: start + 420_000, plannedEndsAt: start + 300_000 }
    expect(countJokes(extended)).toEqual({ total: 4, planned: 2, extra: 2 })
    expect(wasExtended(extended)).toBe(true)
    expect(plannedEnd(extended)).toBe(start + 300_000)
  })

  it('treats a drill that was never extended, or had no limit from the start, as all planned', () => {
    expect(countJokes({ lines, startedAt: start, endsAt: start + 300_000 })).toEqual({ total: 4, planned: 4, extra: 0 })
    expect(countJokes({ lines, startedAt: start, endsAt: null })).toEqual({ total: 4, planned: 4, extra: 0 })
    expect(wasExtended({ endsAt: null })).toBe(false)
  })

  it('counts older lines without timestamps as planned', () => {
    expect(countJokes({ lines: [line(0, 'old')], startedAt: start, endsAt: null, plannedEndsAt: start + 60_000 })).toEqual({ total: 1, planned: 1, extra: 0 })
  })
})

describe('jokesPerMinute and jokesLabel', () => {
  it('uses the time actually spent', () => {
    expect(jokesPerMinute({ lines: [line(0, 'a'), line(1, 'b'), line(2, 'c')], startedAt: start, finishedAt: start + 120_000 })).toBe(1.5)
    expect(jokesPerMinute({ lines: [line(0, 'a')], startedAt: start })).toBeNull()
  })

  it('pluralises', () => {
    expect(jokesLabel(1)).toBe('1 joke')
    expect(jokesLabel(0)).toBe('0 jokes')
    expect(jokesLabel(12)).toBe('12 jokes')
  })
})
