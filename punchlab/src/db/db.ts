import Dexie, { type EntityTable } from 'dexie'

/** Simple key/value store for app settings. Feature tables are added in later schema versions. */
export interface Setting {
  key: string
  value: string
}

export class PunchLabDB extends Dexie {
  settings!: EntityTable<Setting, 'key'>

  constructor(name = 'punchlab') {
    super(name)
    this.version(1).stores({
      settings: 'key',
    })
  }
}

export const db = new PunchLabDB()
