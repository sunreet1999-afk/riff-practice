import type { ReactionKind } from '../types'

export const REACTIONS: { kind: ReactionKind; label: string; emoji: string }[] = [
  { kind: 'laughed', label: 'Laughed', emoji: '😂' },
  { kind: 'smiled', label: 'Smiled', emoji: '🙂' },
  { kind: 'none', label: 'No reaction', emoji: '😐' },
  { kind: 'flat', label: 'Fell flat', emoji: '😬' },
]

export function reactionMeta(kind: ReactionKind) {
  return REACTIONS.find((r) => r.kind === kind) ?? REACTIONS[2]
}

/** The text to share for a picked line: the rewrite if there is one, else the original. */
export function shareableText(pick: { original: string; rewrite: string }): string {
  return pick.rewrite.trim() || pick.original
}
