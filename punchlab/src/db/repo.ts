import { computeStreak, localDateKey } from '../lib/dates'
import { SLOT_COUNT, structureForSlot } from '../lib/structures'
import { drillEndsAt } from '../lib/timer'
import type { DrillLine, JudgePick, Prompt, PromptKind, Session } from '../types'
import { db as defaultDb, type PunchLabDB } from './db'

export interface NewPromptInput {
  kind: PromptKind
  text: string
  image?: Blob
}

export function createRepo(db: PunchLabDB = defaultDb) {
  return {
    async addPrompt(input: NewPromptInput, now: Date = new Date()): Promise<number> {
      const prompt: Prompt = { ...input, dateKey: localDateKey(now), createdAt: now.getTime() }
      return db.prompts.add(prompt) as Promise<number>
    },

    getPrompt(id: number): Promise<Prompt | undefined> {
      return db.prompts.get(id)
    },

    /** Most recently added prompt for the given day, if any. */
    async getPromptForDay(now: Date = new Date()): Promise<Prompt | undefined> {
      const rows = await db.prompts.where('dateKey').equals(localDateKey(now)).sortBy('createdAt')
      return rows.at(-1)
    },

    async startSession(promptId: number, now: Date = new Date()): Promise<number> {
      const lines: DrillLine[] = Array.from({ length: SLOT_COUNT }, (_, slot) => ({
        slot,
        structure: structureForSlot(slot),
        text: '',
      }))
      const session: Session = {
        promptId,
        dateKey: localDateKey(now),
        status: 'drilling',
        startedAt: now.getTime(),
        endsAt: drillEndsAt(now.getTime()),
        activeSlot: 0,
        lines,
        picks: [],
      }
      return db.sessions.add(session) as Promise<number>
    },

    getSession(id: number): Promise<Session | undefined> {
      return db.sessions.get(id)
    },

    /** Persists locked lines as the drill goes, so a closed tab loses at most the line being typed. */
    async lockLines(id: number, lines: DrillLine[], activeSlot: number): Promise<void> {
      await db.sessions.update(id, { lines, activeSlot })
    },

    async finishDrill(id: number, lines: DrillLine[], now: Date = new Date()): Promise<void> {
      await db.sessions.update(id, { lines, activeSlot: SLOT_COUNT, status: 'judging', finishedAt: now.getTime() })
    },

    async saveJudgement(id: number, picks: JudgePick[]): Promise<void> {
      await db.sessions.update(id, { picks, status: 'done' })
    },

    /** A drill or judge step left unfinished (e.g. the app was closed). */
    async getUnfinishedSession(): Promise<Session | undefined> {
      const rows = await db.sessions.where('status').anyOf('drilling', 'judging').sortBy('startedAt')
      return rows.at(-1)
    },

    async getStreak(today: Date = new Date()): Promise<number> {
      const done = await db.sessions.where('status').equals('done').toArray()
      return computeStreak(done.map((s) => s.dateKey), today)
    },
  }
}

export type Repo = ReturnType<typeof createRepo>
export const repo = createRepo()
