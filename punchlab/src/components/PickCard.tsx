import { useState } from 'react'
import { repo } from '../db/repo'
import { useConfirmTap } from '../hooks/useConfirmTap'
import { formatDay } from '../lib/format'
import { reactionMeta, shareableText } from '../lib/reactions'
import { shareText } from '../lib/share'
import type { JudgePick, Reaction, ReactionKind, ShareMethod } from '../types'
import { CharCount } from './CharCount'
import { ReactionSheet } from './ReactionSheet'

interface PickCardProps {
  sessionId: number
  pick: JudgePick
  structure: string
  reactions: Reaction[]
}

function ReactionItem({ reaction }: { reaction: Reaction }) {
  const meta = reactionMeta(reaction.reaction)
  const confirmDelete = useConfirmTap()
  function remove() {
    confirmDelete.tap(() => void repo.deleteReaction(reaction.id!))
  }
  return (
    <li className="flex items-center gap-2 rounded-xl bg-bg py-1 pr-1 pl-3">
      <span aria-hidden>{meta.emoji}</span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">{meta.label}</span>
        {reaction.note && <span className="text-muted"> · {reaction.note}</span>}
        <span className="block text-xs text-muted">{formatDay(reaction.createdAt)}</span>
      </span>
      <button
        type="button"
        onClick={remove}
        aria-label={confirmDelete.armed ? `Confirm delete reaction ${meta.label}` : `Delete reaction ${meta.label}`}
        className={`h-12 min-w-12 shrink-0 rounded-lg px-2 active:bg-line ${confirmDelete.armed ? 'text-red-400' : 'text-muted'}`}
      >
        {confirmDelete.armed ? 'Sure?' : '✕'}
      </button>
    </li>
  )
}

/** A chosen line with share + reaction logging. */
export function PickCard({ sessionId, pick, structure, reactions }: PickCardProps) {
  const text = shareableText(pick)
  const [sheet, setSheet] = useState<ShareMethod | null>(null)
  const [status, setStatus] = useState('')

  async function share() {
    const result = await shareText(text)
    if (result === 'shared') setSheet('share')
    else if (result === 'copied') {
      setStatus('Copied. Paste it where you want to share.')
      setSheet('copy')
    } else if (result === 'failed') setStatus("Couldn't share or copy on this device.")
  }

  async function save(reaction: ReactionKind, note: string) {
    const method = sheet ?? 'manual'
    setSheet(null)
    await repo.addReaction({ sessionId, slot: pick.slot, structure, text, reaction, note, method })
    setStatus('Reaction logged.')
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-accent bg-surface p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-accent">
          ★ {pick.slot + 1}. {structure}
        </span>
        <span aria-label={`Rated ${pick.rating} of 5`} className="font-semibold">
          {pick.rating}/5
        </span>
      </div>
      <p className={`whitespace-pre-wrap break-words ${pick.rewrite ? 'text-muted line-through decoration-muted/50' : 'text-lg'}`}>
        {pick.original}
      </p>
      {pick.rewrite && <p className="whitespace-pre-wrap break-words text-lg">{pick.rewrite}</p>}
      {pick.rewrite && (
        <div className="flex justify-end gap-4">
          <CharCount text={pick.original} label="Original" />
          <CharCount text={pick.rewrite} label="Rewrite" />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={share}
          className="min-h-12 flex-1 rounded-xl bg-accent font-semibold text-accent-ink active:brightness-90"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() => setSheet('manual')}
          className="min-h-12 flex-1 rounded-xl border border-line font-semibold active:bg-line"
        >
          Log reaction
        </button>
      </div>
      {status && (
        <p role="status" className="text-sm text-muted">
          {status}
        </p>
      )}

      {reactions.length > 0 && (
        <ul aria-label="Reactions" className="flex flex-col gap-1">
          {reactions.map((r) => (
            <ReactionItem key={r.id} reaction={r} />
          ))}
        </ul>
      )}

      {sheet && <ReactionSheet text={text} onSave={save} onClose={() => setSheet(null)} />}
    </li>
  )
}
