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
  /** Journal note this prompt was created from, if any. */
  noteId?: number
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

export interface Note {
  id?: number
  createdAt: number
  text: string
  /** Set when the note has been turned into a drill prompt. */
  usedAt?: number
}

/** A finished session joined with its prompt, for list and detail views. */
export interface SessionWithPrompt {
  session: Session
  prompt: Prompt | undefined
}

export type ReactionKind = 'laughed' | 'smiled' | 'none' | 'flat'

export type ShareMethod = 'share' | 'copy' | 'manual'

/** How a shared line landed with real people. */
export interface Reaction {
  id?: number
  sessionId: number
  slot: number
  /** Copied from the line so stats per structure don't need a join. */
  structure: string
  /** The exact text that was shared. */
  text: string
  reaction: ReactionKind
  note: string
  method: ShareMethod
  createdAt: number
}
