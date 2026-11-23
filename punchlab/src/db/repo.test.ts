import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PunchLabDB } from './db'
import { createRepo } from './repo'

const db = new PunchLabDB('punchlab-repo-test')
const repo = createRepo(db)

beforeEach(async () => {
  await Promise.all([db.prompts.clear(), db.sessions.clear()])
})

afterAll(async () => {
  await db.delete()
})

describe('session save/load', () => {
  it('saves a full session and loads it back intact', async () => {
    const now = new Date(2026, 10, 23, 9, 0)
    const promptId = await repo.addPrompt({ kind: 'text', text: 'Metro mein uncle ne speaker pe reel chalayi' }, now)
    const id = await repo.startSession(promptId, now)

    const started = await repo.getSession(id)
    expect(started?.status).toBe('drilling')
    expect(started?.lines).toHaveLength(10)
    expect(started?.lines[4].structure).toBe('Dialogue')
    expect(started?.endsAt).toBe(now.getTime() + 300_000)

    const lines = started!.lines.map((l) => ({ ...l, text: l.slot < 3 ? `line ${l.slot} — bilkul pagal 😂` : '' }))
    await repo.lockLines(id, lines.slice(), 3)
    expect((await repo.getSession(id))?.activeSlot).toBe(3)
    await repo.finishDrill(id, lines, new Date(now.getTime() + 120_000))
    expect((await repo.getSession(id))?.status).toBe('judging')

    await repo.saveJudgement(id, [
      { slot: 0, original: lines[0].text, rewrite: 'chhota version', rating: 4 },
      { slot: 2, original: lines[2].text, rewrite: '', rating: 2 },
    ])

    const loaded = await repo.getSession(id)
    expect(loaded).toMatchObject({
      id,
      promptId,
      dateKey: '2026-11-23',
      status: 'done',
      activeSlot: 10,
      finishedAt: now.getTime() + 120_000,
    })
    expect(loaded?.lines[1].text).toBe('line 1 — bilkul pagal 😂')
    expect(loaded?.picks).toHaveLength(2)
    expect(loaded?.picks[0]).toEqual({ slot: 0, original: 'line 0 — bilkul pagal 😂', rewrite: 'chhota version', rating: 4 })

    const prompt = await repo.getPrompt(promptId)
    expect(prompt?.text).toBe('Metro mein uncle ne speaker pe reel chalayi')
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

  it('finds an unfinished session and counts only finished ones in the streak', async () => {
    const p = await repo.addPrompt({ kind: 'text', text: 'x' })
    const d1 = await repo.startSession(p, new Date(2026, 10, 22, 9))
    await repo.saveJudgement(d1, [])
    const d2 = await repo.startSession(p, new Date(2026, 10, 23, 9))

    expect((await repo.getUnfinishedSession())?.id).toBe(d2)
    expect(await repo.getStreak(new Date(2026, 10, 23, 20))).toBe(1)

    await repo.saveJudgement(d2, [])
    expect(await repo.getUnfinishedSession()).toBeUndefined()
    expect(await repo.getStreak(new Date(2026, 10, 23, 20))).toBe(2)
  })
})
