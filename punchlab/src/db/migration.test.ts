import Dexie from 'dexie'
import { afterAll, describe, expect, it } from 'vitest'
import { PunchLabDB } from './db'

const NAME = 'punchlab-migration-test'

afterAll(async () => {
  await Dexie.delete(NAME)
})

function oldLines(texts: string[]) {
  return Array.from({ length: 10 }, (_, slot) => ({ slot, structure: `S${slot}`, text: texts[slot] ?? '' }))
}

describe('v4 → v5 migration', () => {
  it('maps old statuses, trims unused fixed slots and drops activeSlot', async () => {
    // Write data in the old (v4) shape with a bare Dexie instance.
    const old = new Dexie(NAME)
    old.version(4).stores({
      settings: 'key',
      prompts: '++id, dateKey, createdAt',
      sessions: '++id, status, dateKey, startedAt, promptId',
      notes: '++id, createdAt',
      reactions: '++id, sessionId, structure, createdAt',
    })
    const base = { promptId: 1, dateKey: '2026-11-23', startedAt: 1, endsAt: 300_001, picks: [] }
    await old.table('sessions').bulkAdd([
      { ...base, id: 1, status: 'drilling', activeSlot: 2, lines: oldLines(['a', '']) },
      { ...base, id: 2, status: 'judging', activeSlot: 10, lines: oldLines(['a', '', 'c']) },
      { ...base, id: 3, status: 'done', activeSlot: 10, lines: oldLines(['a']), picks: [{ slot: 0, original: 'a', rewrite: '', rating: 3 }] },
    ])
    old.close()

    const db = new PunchLabDB(NAME)
    const [drilling, judging, done] = await db.sessions.bulkGet([1, 2, 3])
    db.close()

    expect(drilling).toMatchObject({ status: 'drilling' })
    expect(drilling?.lines.map((l) => l.text)).toEqual(['a', ''])
    expect(judging).toMatchObject({ status: 'drilled' })
    expect(judging?.lines.map((l) => l.text)).toEqual(['a', '', 'c'])
    expect(done).toMatchObject({ status: 'done' })
    expect(done?.lines.map((l) => l.text)).toEqual(['a'])
    for (const s of [drilling, judging, done]) expect(s).not.toHaveProperty('activeSlot')
  })
})
