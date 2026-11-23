import Dexie, { type EntityTable } from 'dexie'
import type { Note, Prompt, Reaction, Session } from '../types'

/** Simple key/value store for app settings. */
export interface Setting {
  key: string
  value: string
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
  }
}

export const db = new PunchLabDB()
