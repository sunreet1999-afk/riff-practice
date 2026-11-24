import { useEffect, useRef } from 'react'
import { lineLabel } from '../lib/lineLabel'
import type { DrillLine } from '../types'

/** A line that has been locked during the drill (read-only). */
export function LockedLine({ line }: { line: DrillLine }) {
  return (
    <li className="rounded-2xl border border-line p-3">
      <div className="mb-1 flex items-center justify-between text-sm text-muted">
        <span className="font-semibold">{lineLabel(line)}</span>
        <span>🔒</span>
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
}

/** The line currently being written. */
export function ActiveLine({ line, draft, onDraftChange }: ActiveLineProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.focus({ preventScroll: true })
    ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [line.slot])

  return (
    <li className="rounded-2xl border border-accent bg-surface p-3">
      <p className="mb-2 text-sm font-semibold text-accent">{lineLabel(line)}</p>
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={3}
        autoCapitalize="sentences"
        autoComplete="off"
        enterKeyHint="enter"
        aria-label={lineLabel(line)}
        placeholder="Type your line (English / Hinglish)…"
        className="w-full resize-none rounded-xl bg-bg p-3 text-lg text-ink outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent"
      />
    </li>
  )
}
