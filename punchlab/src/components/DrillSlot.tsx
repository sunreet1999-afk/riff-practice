import { useEffect, useRef } from 'react'
import type { DrillLine } from '../types'

interface LockedLineProps {
  line: DrillLine
  highlight?: boolean
}

function Label({ line, highlight, active }: { line: DrillLine; highlight: boolean; active: boolean }) {
  return (
    <span className={`font-semibold ${active ? 'text-accent' : 'text-muted'}`}>
      {line.slot + 1}. {line.structure}
      {highlight && <span className="ml-2 rounded-md bg-accent/15 px-1.5 py-0.5 text-xs text-accent">★ This week</span>}
    </span>
  )
}

/** A line that has been locked during the drill (read-only). */
export function LockedLine({ line, highlight = false }: LockedLineProps) {
  return (
    <li className="rounded-2xl border border-line p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <Label line={line} highlight={highlight} active={false} />
        <span className="text-muted">🔒</span>
      </div>
      <p className={`whitespace-pre-wrap break-words ${line.text ? 'text-ink/80' : 'italic text-muted'}`}>
        {line.text || 'Skipped'}
      </p>
    </li>
  )
}

interface ActiveLineProps {
  line: DrillLine
  draft: string
  onDraftChange: (text: string) => void
  /** Structure of the slot after this one, shown as a hint. */
  next: string
  highlight?: boolean
}

/** The line currently being written. */
export function ActiveLine({ line, draft, onDraftChange, next, highlight = false }: ActiveLineProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.focus({ preventScroll: true })
    ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [line.slot])

  return (
    <li className="rounded-2xl border border-accent bg-surface p-3">
      <div className="mb-2 text-sm">
        <Label line={line} highlight={highlight} active />
      </div>
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
      <p className="mt-2 text-sm text-muted">Next: {next}</p>
    </li>
  )
}
