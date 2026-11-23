import { charCount } from '../lib/text'

export function CharCount({ text, label }: { text: string; label?: string }) {
  return (
    <span className="text-sm tabular-nums text-muted" aria-live="polite">
      {label ? `${label} ` : ''}
      {charCount(text)} chars
    </span>
  )
}
