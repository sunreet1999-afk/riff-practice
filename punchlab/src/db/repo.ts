import { computeStreak, localDateKey } from '../lib/dates'
import { extendedEndsAt, type Extension } from '../lib/drillStats'
import { DEFAULT_DRILL_LENGTH, drillEndsAt, parseDrillLength, type DrillLength } from '../lib/timer'
import type { DrillLine, JudgePick, Note, Prompt, PromptKind, Reaction, Session, SessionWithPrompt } from '../types'
import { db as defaultDb, type PunchLabDB } from './db'

export interface NewPromptInput {
  kind: PromptKind
  text: string
  image?: Blob
  noteId?: number
}

export function createRepo(db: PunchLabDB = defaultDb) {
  return {
    async addPrompt(input: NewPromptInput, now: Date = new Date()): Promise<number> {
      const prompt: Prompt = { ...input, dateKey: localDateKey(now), createdAt: now.getTime() }
      return db.transaction('rw', db.prompts, db.notes, async () => {
        const id = (await db.prompts.add(prompt)) as number
        if (input.noteId !== undefined) await db.notes.update(input.noteId, { usedAt: now.getTime() })
        return id
      })
    },

    getPrompt(id: number): Promise<Prompt | undefined> {
      return db.prompts.get(id)
    },

    /** Most recently added prompt for the given day, if any. */
    async getPromptForDay(now: Date = new Date()): Promise<Prompt | undefined> {
      const rows = await db.prompts.where('dateKey').equals(localDateKey(now)).sortBy('createdAt')
      return rows.at(-1)
    },

    async startSession(promptId: number, now: Date = new Date(), length: DrillLength = DEFAULT_DRILL_LENGTH): Promise<number> {
      const session: Session = {
        promptId,
        dateKey: localDateKey(now),
        status: 'drilling',
        startedAt: now.getTime(),
        endsAt: drillEndsAt(now.getTime(), length),
        lines: [],
        picks: [],
      }
      return db.sessions.add(session) as Promise<number>
    },

    getSession(id: number): Promise<Session | undefined> {
      return db.sessions.get(id)
    },

    /** Persists locked lines as the drill goes, so a closed tab loses at most the line being typed. */
    async lockLines(id: number, lines: DrillLine[]): Promise<void> {
      await db.sessions.update(id, { lines })
    },

    /**
     * Gives a running drill more time (or no limit) once its timer has run out.
     * The first extension remembers the original end so jokes in extra time can be counted separately.
     */
    async extendDrill(id: number, extension: Extension, lines: DrillLine[], now: Date = new Date()): Promise<void> {
      await db.transaction('rw', db.sessions, async () => {
        const session = await db.sessions.get(id)
        if (!session || session.status !== 'drilling') return
        const plannedEndsAt = session.plannedEndsAt !== undefined ? session.plannedEndsAt : session.endsAt
        await db.sessions.update(id, { lines, plannedEndsAt, endsAt: extendedEndsAt(now.getTime(), extension) })
      })
    },

    /** Jokes (written lines) in completed drills: today and all time. */
    async getJokeTotals(now: Date = new Date()): Promise<{ today: number; total: number; drills: number }> {
      const completed = await db.sessions.where('status').anyOf('drilled', 'done').toArray()
      const today = localDateKey(now)
      let total = 0
      let todayCount = 0
      for (const s of completed) {
        const n = s.lines.filter((l) => l.text).length
        total += n
        if (s.dateKey === today) todayCount += n
      }
      return { today: todayCount, total, drills: completed.length }
    },

    /** Ends Stage 1. The drill is saved and counts toward the streak; judging is optional. */
    async finishDrill(id: number, lines: DrillLine[], now: Date = new Date()): Promise<void> {
      await db.sessions.update(id, { lines, status: 'drilled', finishedAt: now.getTime() })
    },

    async saveJudgement(id: number, picks: JudgePick[]): Promise<void> {
      await db.sessions.update(id, { picks, status: 'done' })
    },

    /** A drill left running (e.g. the app was closed mid-drill). */
    async getUnfinishedSession(): Promise<Session | undefined> {
      const rows = await db.sessions.where('status').equals('drilling').sortBy('startedAt')
      return rows.at(-1)
    },

    /** Up to `limit` completed sessions that started before `before`, newest first (for progress comparisons). */
    async listPreviousSessions(before: number, limit = 3): Promise<SessionWithPrompt[]> {
      const all = await this.listCompletedSessions()
      return all.filter((x) => x.session.startedAt < before).slice(0, limit)
    },

    /** Sessions with Stage 1 complete (judged or not), newest first, each with its prompt. */
    async listCompletedSessions(): Promise<SessionWithPrompt[]> {
      const sessions = (await db.sessions.where('status').anyOf('drilled', 'done').sortBy('startedAt')).reverse()
      const prompts = await db.prompts.bulkGet([...new Set(sessions.map((s) => s.promptId))])
      const byId = new Map(prompts.filter((p): p is Prompt => p !== undefined).map((p) => [p.id!, p]))
      return sessions.map((session) => ({ session, prompt: byId.get(session.promptId) }))
    },

    /** Text of the most recent prompts, newest first (so AI ideas don't repeat them). */
    async listRecentPromptTexts(limit = 10): Promise<string[]> {
      const rows = await db.prompts.orderBy('createdAt').reverse().limit(limit).toArray()
      return rows.map((p) => p.text).filter(Boolean)
    },

    async addNote(text: string, now: Date = new Date()): Promise<number> {
      const note: Note = { text, createdAt: now.getTime() }
      return db.notes.add(note) as Promise<number>
    },

    getNote(id: number): Promise<Note | undefined> {
      return db.notes.get(id)
    },

    /** Journal notes, newest first. */
    async listNotes(): Promise<Note[]> {
      return (await db.notes.orderBy('createdAt').toArray()).reverse()
    },

    async deleteNote(id: number): Promise<void> {
      await db.notes.delete(id)
    },

    async addReaction(input: Omit<Reaction, 'id' | 'createdAt'>, now: Date = new Date()): Promise<number> {
      return db.reactions.add({ ...input, createdAt: now.getTime() }) as Promise<number>
    },

    /** Reactions logged for one session, oldest first. */
    listReactions(sessionId: number): Promise<Reaction[]> {
      return db.reactions.where('sessionId').equals(sessionId).sortBy('createdAt')
    },

    async deleteReaction(id: number): Promise<void> {
      await db.reactions.delete(id)
    },

    /** Last drill length the user picked; defaults to 5 minutes. */
    async getDrillLength(): Promise<DrillLength> {
      return parseDrillLength((await db.settings.get('drillLength'))?.value)
    },

    async setDrillLength(length: DrillLength): Promise<void> {
      await db.settings.put({ key: 'drillLength', value: String(length) })
    },

    async getStreak(today: Date = new Date()): Promise<number> {
      const completed = await db.sessions.where('status').anyOf('drilled', 'done').toArray()
      return computeStreak(completed.map((s) => s.dateKey), today)
    },
  }
}

export type Repo = ReturnType<typeof createRepo>
export const repo = createRepo()
