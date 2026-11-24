import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { DrillLine } from '../types'
import { PunchLabDB } from './db'
import { createRepo } from './repo'

const db = new PunchLabDB('punchlab-repo-test')
const repo = createRepo(db)

beforeEach(async () => {
  await Promise.all([db.prompts.clear(), db.sessions.clear(), db.settings.clear()])
})

afterAll(async () => {
  await db.delete()
})

function linesOf(texts: string[]): DrillLine[] {
  return texts.map((text, slot) => ({ slot, structure: '', text }))
}

describe('session save/load', () => {
  it('saves a drill with more than 10 lines as Stage 1, then a judgement as Stage 2', async () => {
    const now = new Date(2026, 10, 23, 9, 0)
    const promptId = await repo.addPrompt({ kind: 'text', text: 'Metro mein uncle ne speaker pe reel chalayi' }, now)
    const id = await repo.startSession(promptId, now)

    const started = await repo.getSession(id)
    expect(started).toMatchObject({ status: 'drilling', lines: [], picks: [], endsAt: now.getTime() + 300_000 })

    const texts = Array.from({ length: 13 }, (_, i) => (i === 2 ? '' : `line ${i} — bilkul pagal 😂`))
    await repo.lockLines(id, linesOf(texts.slice(0, 3)))
    expect((await repo.getSession(id))?.lines).toHaveLength(3)

    await repo.finishDrill(id, linesOf(texts), new Date(now.getTime() + 300_000))
    const drilled = await repo.getSession(id)
    expect(drilled?.status).toBe('drilled')
    expect(drilled?.lines).toHaveLength(13)
    expect(drilled?.lines[12]).toEqual({ slot: 12, structure: '', text: 'line 12 — bilkul pagal 😂' })
    expect(drilled?.lines[2].text).toBe('')

    await repo.saveJudgement(id, [
      { slot: 0, original: texts[0], rewrite: 'chhota version', rating: 4 },
      { slot: 11, original: texts[11], rewrite: '', rating: 2 },
    ])
    const loaded = await repo.getSession(id)
    expect(loaded).toMatchObject({ id, promptId, dateKey: '2026-11-23', status: 'done', finishedAt: now.getTime() + 300_000 })
    expect(loaded?.lines).toHaveLength(13)
    expect(loaded?.picks[1]).toEqual({ slot: 11, original: 'line 11 — bilkul pagal 😂', rewrite: '', rating: 2 })
    expect((await repo.getPrompt(promptId))?.text).toBe('Metro mein uncle ne speaker pe reel chalayi')
  })

  it('starts a drill with the chosen length and remembers the choice', async () => {
    const now = new Date(2026, 10, 24, 9)
    const p = await repo.addPrompt({ kind: 'text', text: 'x' }, now)
    expect(await repo.getDrillLength()).toBe(5)
    const id = await repo.startSession(p, now, 2)
    expect((await repo.getSession(id))?.endsAt).toBe(now.getTime() + 120_000)
    const open = await repo.startSession(p, now, 'unlimited')
    expect((await repo.getSession(open))?.endsAt).toBeNull()

    await repo.setDrillLength('unlimited')
    expect(await repo.getDrillLength()).toBe('unlimited')
    await repo.setDrillLength(10)
    expect(await repo.getDrillLength()).toBe(10)
    await db.settings.put({ key: 'drillLength', value: '7' }) // invalid value falls back to 5
    expect(await repo.getDrillLength()).toBe(5)
  })

  it('lists up to 3 earlier completed sessions for progress comparison', async () => {
    const p = await repo.addPrompt({ kind: 'text', text: 'x' })
    const ids: number[] = []
    for (let d = 18; d <= 23; d++) {
      const id = await repo.startSession(p, new Date(2026, 10, d, 9))
      await repo.finishDrill(id, linesOf([`day ${d}`]))
      ids.push(id)
    }
    await repo.startSession(p, new Date(2026, 10, 22, 12)) // unfinished: never compared
    const before = new Date(2026, 10, 23, 9).getTime()
    const prev = await repo.listPreviousSessions(before)
    expect(prev.map((x) => x.session.lines[0].text)).toEqual(['day 22', 'day 21', 'day 20'])
  })

  it('stores an image prompt locally', async () => {
    const image = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
    const id = await repo.addPrompt({ kind: 'image', text: '', image })
    const prompt = await repo.getPrompt(id)
    expect(prompt?.kind).toBe('image')
    expect(prompt?.image).toBeDefined()
  })

  it("returns today's latest prompt only", async () => {
    const today = new Date(2026, 10, 23, 8)
    await repo.addPrompt({ kind: 'text', text: 'yesterday' }, new Date(2026, 10, 22, 8))
    await repo.addPrompt({ kind: 'text', text: 'first' }, today)
    await repo.addPrompt({ kind: 'text', text: 'second' }, new Date(2026, 10, 23, 9))
    expect((await repo.getPromptForDay(today))?.text).toBe('second')
    expect(await repo.getPromptForDay(new Date(2026, 10, 24))).toBeUndefined()
  })

  it('counts a drill toward the streak as soon as Stage 1 is done, judged or not', async () => {
    const p = await repo.addPrompt({ kind: 'text', text: 'x' })
    const d1 = await repo.startSession(p, new Date(2026, 10, 22, 9))
    await repo.finishDrill(d1, linesOf(['a']))
    const d2 = await repo.startSession(p, new Date(2026, 10, 23, 9))

    expect((await repo.getUnfinishedSession())?.id).toBe(d2)
    expect(await repo.getStreak(new Date(2026, 10, 23, 20))).toBe(1)

    await repo.finishDrill(d2, linesOf(['b']))
    expect(await repo.getUnfinishedSession()).toBeUndefined()
    expect(await repo.getStreak(new Date(2026, 10, 23, 20))).toBe(2)

    await repo.saveJudgement(d1, [])
    expect(await repo.getStreak(new Date(2026, 10, 23, 20))).toBe(2)
  })
})
