import { formatDay } from './format'
import type { Prompt, Session } from '../types'

/**
 * Plain-text summary of a drill to paste into ChatGPT, Claude or a notes app.
 * Lists written lines only (skipped ones are left out) with their app line numbers and structure labels.
 */
export function drillToText(session: Session, prompt: Prompt | undefined): string {
  const written = session.lines.filter((l) => l.text)
  const lines: string[] = [`PunchLab drill, ${formatDay(session.startedAt)}`]
  lines.push(`Stage 1 complete: ${written.length} line${written.length === 1 ? '' : 's'} in 5 minutes.`)
  lines.push('')
  if (prompt?.kind === 'image') {
    lines.push(`Prompt: [photo, attach it separately]${prompt.text ? ` ${prompt.text}` : ''}`)
  } else {
    lines.push(`Prompt: ${prompt?.text ?? '(missing)'}`)
  }
  lines.push('')
  lines.push('Lines:')
  // Numbered by slot, matching the app, so "line 5" means the same line in both places.
  for (const l of written) lines.push(`${l.slot + 1}. [${l.structure}] ${l.text}`)
  if (session.picks.length > 0) {
    lines.push('')
    lines.push('My best picks (Stage 2):')
    for (const p of session.picks) {
      lines.push(`- ${p.rewrite || p.original} (self-rating ${p.rating}/5)`)
    }
  }
  return lines.join('\n')
}
