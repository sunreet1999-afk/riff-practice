import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { shareableText } from '../lib/reactions'
import { PunchLabDB } from './db'
import { createRepo } from './repo'

const db = new PunchLabDB('punchlab-reactions-test')
const repo = createRepo(db)

beforeEach(async () => {
  await db.reactions.clear()
})

afterAll(async () => {
  await db.delete()
})

describe('reaction log', () => {
  it('logs several reactions for one line and lists them per session, oldest first', async () => {
    const base = { sessionId: 1, slot: 0, structure: 'Exaggeration', text: 'Lift itni slow hai…', method: 'share' as const }
    await repo.addReaction({ ...base, reaction: 'smiled', note: 'Didi ko bheja' }, new Date(2026, 10, 23, 10))
    await repo.addReaction({ ...base, reaction: 'laughed', note: '' }, new Date(2026, 10, 23, 9))
    await repo.addReaction({ ...base, sessionId: 2, reaction: 'flat', note: '' })

    const rows = await repo.listReactions(1)
    expect(rows.map((r) => r.reaction)).toEqual(['laughed', 'smiled'])
    expect(rows[1]).toMatchObject({ note: 'Didi ko bheja', structure: 'Exaggeration', method: 'share' })
  })

  it('deletes a mistaken log', async () => {
    const id = await repo.addReaction({
      sessionId: 3, slot: 1, structure: 'Reversal', text: 'x', reaction: 'none', note: '', method: 'copy',
    })
    await repo.deleteReaction(id)
    expect(await repo.listReactions(3)).toEqual([])
  })
})

describe('shareableText', () => {
  it('prefers the rewrite and falls back to the original', () => {
    expect(shareableText({ original: 'long version', rewrite: 'short' })).toBe('short')
    expect(shareableText({ original: 'long version', rewrite: '   ' })).toBe('long version')
  })
})
