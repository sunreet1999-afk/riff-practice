import Dexie, { type EntityTable } from 'dexie'
import type { DrillLine, Note, Prompt, Reaction, Session } from '../types'

/** Simple key/value store for app settings. */
export interface Setting {
  key: string
  value: string
}

function trimTrailingEmpty(lines: DrillLine[]): DrillLine[] {
  let end = lines.length
  while (end > 0 && !lines[end - 1].text) end--
  return lines.slice(0, end)
}

export class PunchLabDB extends Dexie {
  settings!: EntityTable<Setting, 'key'>
  prompts!: EntityTable<Prompt, 'id'>
  sessions!: EntityTable<Session, 'id'>
  notes!: EntityTable<Note, 'id'>
  reactions!: EntityTable<Reaction, 'id'>

  constructor(name = 'punchlab') {
    super(name)
    this.version(1).stores({
      settings: 'key',
    })
    this.version(2).stores({
      prompts: '++id, dateKey, createdAt',
      sessions: '++id, status, dateKey, startedAt, promptId',
    })
    this.version(3).stores({
      notes: '++id, createdAt',
    })
    this.version(4).stores({
      reactions: '++id, sessionId, structure, createdAt',
    })
    // v5: unlimited drill lines and an optional Judge stage.
    // 'judging' becomes 'drilled'; lines keep only what was locked; activeSlot is dropped.
    this.version(5)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('sessions')
          .toCollection()
          .modify((s: Record<string, unknown>) => {
            const lines = Array.isArray(s.lines) ? (s.lines as DrillLine[]) : []
            const active = typeof s.activeSlot === 'number' ? s.activeSlot : lines.length
            if (s.status === 'judging') s.status = 'drilled'
            s.lines = s.status === 'drilling' ? lines.slice(0, active) : trimTrailingEmpty(lines)
            delete s.activeSlot
          }),
      )
  }
}

export const db = new PunchLabDB()
