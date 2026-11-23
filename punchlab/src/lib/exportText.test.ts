import { describe, expect, it } from 'vitest'
import type { Prompt, Session } from '../types'
import { drillToText } from './exportText'

const session: Session = {
  id: 1,
  promptId: 1,
  dateKey: '2026-11-23',
  status: 'drilled',
  startedAt: new Date(2026, 10, 23, 9).getTime(),
  endsAt: 0,
  lines: [
    { slot: 0, structure: 'Exaggeration', text: 'Chacha ka josh dekh ke DJ ne overtime maanga' },
    { slot: 1, structure: 'Reversal', text: '' },
    { slot: 2, structure: 'Literal interpretation', text: 'नाच नचाया' },
  ],
  picks: [],
}
const prompt: Prompt = { id: 1, dateKey: '2026-11-23', createdAt: 0, kind: 'text', text: 'Shaadi mein DJ' }

describe('drillToText', () => {
  it('lists the prompt and written lines with structure labels, skipping empty ones', () => {
    const text = drillToText(session, prompt)
    expect(text).toContain('Stage 1 complete: 2 lines in 5 minutes.')
    expect(text).toContain('Prompt: Shaadi mein DJ')
    expect(text).toContain('1. [Exaggeration] Chacha ka josh dekh ke DJ ne overtime maanga')
    expect(text).toContain('3. [Literal interpretation] नाच नचाया') // numbered like the app, gap where a line was skipped
    expect(text).not.toContain('[Reversal]')
    expect(text).not.toContain('Stage 2')
  })

  it('notes photo prompts and includes picks once judged', () => {
    const judged: Session = {
      ...session,
      status: 'done',
      picks: [{ slot: 0, original: 'Chacha ka josh…', rewrite: 'DJ ne overtime maanga', rating: 4 }],
    }
    const text = drillToText(judged, { ...prompt, kind: 'image', text: 'shaadi' })
    expect(text).toContain('Prompt: [photo, attach it separately] shaadi')
    expect(text).toContain('My best picks (Stage 2):\n- DJ ne overtime maanga (self-rating 4/5)')
  })
})
