export type PromptKind = 'text' | 'image'

export interface Prompt {
  id?: number
  /** Local calendar day, YYYY-MM-DD. */
  dateKey: string
  createdAt: number
  kind: PromptKind
  /** Situation text, or an optional caption for an image prompt. */
  text: string
  image?: Blob
}

export type SessionStatus = 'drilling' | 'judging' | 'done'

export interface DrillLine {
  slot: number
  structure: string
  text: string
}

export interface JudgePick {
  slot: number
  original: string
  rewrite: string
  /** Self-rating 1–5. */
  rating: number
}

export interface Session {
  id?: number
  promptId: number
  dateKey: string
  status: SessionStatus
  startedAt: number
  /** Wall-clock time the drill timer ends; drives the countdown so it survives tab switches. */
  endsAt: number
  finishedAt?: number
  /** Slot currently being written; every slot before it is locked. Equals SLOT_COUNT when all are locked. */
  activeSlot: number
  lines: DrillLine[]
  picks: JudgePick[]
}
