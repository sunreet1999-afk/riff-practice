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

/**
 * drilling: the 5-minute drill is in progress.
 * drilled:  Stage 1 complete and saved; judging is optional.
 * done:     Stage 2 (Judge) complete too.
 */
export type SessionStatus = 'drilling' | 'drilled' | 'done'

export interface DrillLine {
  slot: number
  /** Structure label from older drills; new drills leave it empty (no labels while writing). */
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
  /** Wall-clock time the drill timer ends (drives the countdown so it survives tab switches); null = no time limit. */
  endsAt: number | null
  finishedAt?: number
  /** Locked lines in order (empty text = skipped). The line being typed is slot `lines.length`. No upper limit. */
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

/** A completed session (Stage 1 or later) joined with its prompt, for list and detail views. */
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
