import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PunchLabDB } from './db'
import { createRepo } from './repo'

const db = new PunchLabDB('punchlab-journal-test')
const repo = createRepo(db)

beforeEach(async () => {
  await Promise.all([db.prompts.clear(), db.sessions.clear(), db.notes.clear()])
})

afterAll(async () => {
  await db.delete()
})

describe('observation journal', () => {
  it('adds notes and lists them newest first', async () => {
    await repo.addNote('Sabzi wale ne UPI QR pe "No udhaar" likha tha', new Date(2026, 10, 20))
    await repo.addNote('Gym mein sab mirror se baat kar rahe the', new Date(2026, 10, 22))
    const notes = await repo.listNotes()
    expect(notes.map((n) => n.text)).toEqual([
      'Gym mein sab mirror se baat kar rahe the',
      'Sabzi wale ne UPI QR pe "No udhaar" likha tha',
    ])
  })

  it('deletes a note', async () => {
    const id = await repo.addNote('temp')
    await repo.deleteNote(id)
    expect(await repo.listNotes()).toEqual([])
  })

  it('turns a note into a prompt and marks the note as used', async () => {
    const now = new Date(2026, 10, 23, 9)
    const noteId = await repo.addNote('Auto wale ne meter ko "decoration" bola')
    const promptId = await repo.addPrompt({ kind: 'text', text: 'Auto wale ne meter ko "decoration" bola', noteId }, now)

    expect((await repo.getPrompt(promptId))?.noteId).toBe(noteId)
    expect((await repo.getNote(noteId))?.usedAt).toBe(now.getTime())
    expect((await repo.getPromptForDay(now))?.id).toBe(promptId)
  })
})

describe('saved sessions list', () => {
  it('lists sessions with Stage 1 complete (judged or not), newest first, with their prompts', async () => {
    const p1 = await repo.addPrompt({ kind: 'text', text: 'first prompt' })
    const p2 = await repo.addPrompt({ kind: 'text', text: 'second prompt' })
    const older = await repo.startSession(p1, new Date(2026, 10, 21))
    const newer = await repo.startSession(p2, new Date(2026, 10, 22))
    await repo.startSession(p2, new Date(2026, 10, 23)) // still drilling: not listed
    await repo.finishDrill(older, [{ slot: 0, structure: 'Exaggeration', text: 'a' }]) // Stage 1 only
    await repo.finishDrill(newer, [{ slot: 0, structure: 'Exaggeration', text: 'a' }])
    await repo.saveJudgement(newer, [{ slot: 0, original: 'a', rewrite: '', rating: 5 }])

    const list = await repo.listCompletedSessions()
    expect(list.map((x) => x.session.id)).toEqual([newer, older])
    expect(list.map((x) => x.prompt?.text)).toEqual(['second prompt', 'first prompt'])
    expect(list.map((x) => x.session.status)).toEqual(['done', 'drilled'])
    expect(list[0].session.picks[0].rating).toBe(5)
  })
})
