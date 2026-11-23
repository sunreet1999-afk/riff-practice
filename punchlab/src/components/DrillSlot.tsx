import { useEffect, useRef } from 'react'
import type { DrillLine } from '../types'

export type SlotState = 'locked' | 'active' | 'upcoming'

interface DrillSlotProps {
  line: DrillLine
  state: SlotState
  draft: string
  onDraftChange: (text: string) => void
  /** This slot uses the structure of the week. */
  highlight?: boolean
}

export function DrillSlot({ line, state, draft, onDraftChange, highlight = false }: DrillSlotProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state !== 'active' || !ref.current) return
    ref.current.focus({ preventScroll: true })
    ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [state])

  return (
    <li
      className={`rounded-2xl border p-3 ${
        state === 'active' ? 'border-accent bg-surface' : 'border-line'
      } ${state === 'upcoming' ? 'opacity-40' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className={`font-semibold ${state === 'active' ? 'text-accent' : 'text-muted'}`}>
          {line.slot + 1}. {line.structure}
          {highlight && <span className="ml-2 rounded-md bg-accent/15 px-1.5 py-0.5 text-xs text-accent">★ This week</span>}
        </span>
        {state === 'locked' && <span className="text-muted">🔒 Locked</span>}
      </div>
      {state === 'locked' && (
        <p className={`whitespace-pre-wrap break-words ${line.text ? 'text-ink/80' : 'italic text-muted'}`}>
          {line.text || 'Skipped'}
        </p>
      )}
      {state === 'active' && (
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={3}
          autoCapitalize="sentences"
          autoComplete="off"
          enterKeyHint="enter"
          aria-label={`Line ${line.slot + 1}: ${line.structure}`}
          placeholder="Type your line (English / Hinglish)…"
          className="w-full resize-none rounded-xl bg-bg p-3 text-lg text-ink outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent"
        />
      )}
    </li>
  )
}
