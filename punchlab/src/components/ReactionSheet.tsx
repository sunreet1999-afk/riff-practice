import { useEffect, useState } from 'react'
import { REACTIONS } from '../lib/reactions'
import type { ReactionKind } from '../types'
import { BigButton } from './BigButton'

interface ReactionSheetProps {
  text: string
  onSave: (reaction: ReactionKind, note: string) => void
  onClose: () => void
}

/** Bottom sheet to log how a shared line landed. */
export function ReactionSheet({ text, onSave, onClose }: ReactionSheetProps) {
  const [reaction, setReaction] = useState<ReactionKind | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reaction-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-3xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <h2 id="reaction-title" className="text-xl font-bold">
          How did it land?
        </h2>
        <p className="line-clamp-3 border-l-2 border-line pl-3 text-muted">{text}</p>
        <div role="radiogroup" aria-label="Reaction" className="grid grid-cols-2 gap-2">
          {REACTIONS.map((r) => (
            <button
              key={r.kind}
              type="button"
              role="radio"
              aria-checked={reaction === r.kind}
              onClick={() => setReaction(r.kind)}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-xl text-lg font-semibold ${
                reaction === r.kind ? 'bg-accent text-accent-ink' : 'border border-line bg-bg active:bg-line'
              }`}
            >
              <span aria-hidden>{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-muted">Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoCapitalize="sentences"
            placeholder="e.g. Office group mein bheja"
            className="min-h-12 rounded-xl bg-bg px-3 text-lg outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent"
          />
        </label>
        <div className="flex gap-2">
          <BigButton variant="ghost" className="!w-auto shrink-0" onClick={onClose}>
            Later
          </BigButton>
          <BigButton disabled={reaction === null} onClick={() => reaction && onSave(reaction, note.trim())}>
            Save reaction
          </BigButton>
        </div>
      </div>
    </div>
  )
}
