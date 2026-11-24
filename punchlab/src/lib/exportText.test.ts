import { describe, expect, it } from 'vitest'
import type { Prompt, Reaction, Session, SessionWithPrompt } from '../types'
import { stage1ForAI, stage2ForAI } from './exportText'

const start = new Date(2026, 10, 24, 9).getTime()
const session: Session = {
  id: 1,
  promptId: 1,
  dateKey: '2026-11-24',
  status: 'drilled',
  startedAt: start,
  endsAt: start + 120_000,
  lines: [
    { slot: 0, structure: '', text: 'Chacha ka josh dekh ke DJ ne overtime maanga' },
    { slot: 1, structure: '', text: '' },
    { slot: 2, structure: 'Literal interpretation', text: 'नाच नचाया' },
  ],
  picks: [],
}
const prompt: Prompt = { id: 1, dateKey: '2026-11-24', createdAt: 0, kind: 'text', text: 'Shaadi mein DJ' }

describe('stage1ForAI', () => {
  const text = stage1ForAI(session, prompt)

  it('starts with an analysis request an AI can act on', () => {
    expect(text.startsWith("I'm practising real-time humour")).toBe(true)
    expect(text).toContain('name the joke structure')
    expect(text).toContain('Pick my 2 strongest lines')
    expect(text).toContain('religion or caste')
    expect(text).toContain('Reply in the language I wrote in (English or Hinglish).')
  })

  it('includes the prompt, drill length and written lines numbered like the app, without labels', () => {
    expect(text).toContain('Prompt: Shaadi mein DJ')
    expect(text).toContain('Drill: 2 min\nJokes written: 2 jokes (skipped lines left out)')
    expect(stage1ForAI({ ...session, endsAt: null, finishedAt: start + 192_000 }, prompt)).toContain(
      'Drill: no time limit, took 3:12\nJokes written: 2 jokes, 0.6 per minute',
    )
    expect(text).toContain('1. Chacha ka josh dekh ke DJ ne overtime maanga')
    expect(text).toContain('3. नाच नचाया')
    expect(text).not.toContain('Literal interpretation]')
    const linesBlock = text.slice(text.indexOf('Lines:'))
    expect(linesBlock).not.toMatch(/^2\. /m) // the skipped line is left out
  })

  it('marks photo prompts', () => {
    expect(stage1ForAI(session, { ...prompt, kind: 'image', text: 'shaadi' })).toContain('Prompt: [photo, attached separately] Caption: shaadi')
  })
})

describe('stage2ForAI', () => {
  const judged: Session = {
    ...session,
    status: 'done',
    picks: [
      { slot: 0, original: 'Chacha ka josh dekh ke DJ ne overtime maanga', rewrite: 'DJ ne overtime maanga', rating: 4 },
      { slot: 2, original: 'नाच नचाया', rewrite: '', rating: 2 },
    ],
  }

  it('asks for a review of picks, rewrites and ratings, with the data', () => {
    const text = stage2ForAI(judged, prompt)
    expect(text).toContain('the 2 I picked as best')
    expect(text).toContain('Do you agree with my picks?')
    expect(text).toContain('Give your own 1–5 rating')
    expect(text).toContain('- Line 1, self-rating 4/5\n  Original: Chacha ka josh dekh ke DJ ne overtime maanga\n  My rewrite: DJ ne overtime maanga')
    expect(text).toContain('- Line 3, self-rating 2/5\n  Original: नाच नचाया\n\nPrevious drills') // no rewrite line when there's none
    expect(text).not.toContain('reacted')
    expect(text).toContain('4. Progress meter.')
    expect(text).toContain('5. One concrete takeaway')
  })

  it('adds reactions and a question about them when any were logged', () => {
    const reactions: Reaction[] = [
      { sessionId: 1, slot: 0, structure: '', text: 'DJ ne overtime maanga', reaction: 'laughed', note: 'family group', method: 'share', createdAt: 0 },
    ]
    const text = stage2ForAI(judged, prompt, reactions)
    expect(text).toContain('how real people reacted')
    expect(text).toContain('- Line 1: Laughed (family group)')
    expect(text).toContain('4. What do the reactions suggest')
    expect(text).toContain('5. Progress meter.')
    expect(text).toContain('6. One concrete takeaway')
  })
})

describe('progress meter', () => {
  const earlier = (day: number, texts: string[], extra: Partial<Session> = {}): SessionWithPrompt => {
    const t = new Date(2026, 10, day, 9).getTime()
    return {
      session: { ...session, id: day, startedAt: t, endsAt: t + 300_000, lines: texts.map((text, slot) => ({ slot, structure: '', text })), ...extra },
      prompt: { ...prompt, text: `prompt ${day}` },
    }
  }

  it('asks for an honest, fixed-format meter and calls the first drill a baseline', () => {
    const text = stage1ForAI(session, prompt)
    expect(text).toContain('6. Progress meter. Be honest.')
    expect(text).toContain('Meter: [■■■■■■□□□□] X/10 · Trend: Improving / Same / Declining')
    expect(text).toContain("Don't inflate scores to encourage me. If I haven't improved, say so plainly.")
    expect(text).toContain('Earlier drills: none, this is the baseline')
    expect(text).toContain('Previous drills: none yet. This is my first drill.')
  })

  it('includes earlier drills (newest first), trimming long ones', () => {
    const many = Array.from({ length: 18 }, (_, i) => `old ${i + 1}`)
    const text = stage1ForAI(session, prompt, [earlier(23, ['kal ki line']), earlier(21, many)])
    expect(text).toContain('Earlier drills: X/10, X/10 (newest first)') // one slot per earlier drill
    expect(text).toContain('Previous drills, newest first (2):')
    expect(text).toMatch(/\[Earlier drill 1\] .*, 5 min, 1 joke\nPrompt: prompt 23\n1\. kal ki line/)
    expect(text).toContain('15. old 15')
    expect(text).not.toContain('16. old 16')
    expect(text).toContain('(+3 more lines not shown)')
    expect(text.indexOf('--- THIS DRILL ---')).toBeLessThan(text.indexOf('Previous drills'))
  })

  it("adds earlier picks to Stage 2 so judgement can be compared", () => {
    const judgedBefore = earlier(22, ['purani line'], {
      status: 'done',
      picks: [{ slot: 0, original: 'purani line', rewrite: '', rating: 3 }],
    })
    const now: Session = { ...session, status: 'done', picks: [{ slot: 0, original: 'x', rewrite: '', rating: 4 }] }
    const text = stage2ForAI(now, prompt, [], [judgedBefore])
    expect(text).toContain('Compare my best lines and my judgement')
    expect(text).toContain('My picks then:\n- Line 1, self-rating 3/5\n  Original: purani line')
    expect(stage1ForAI(now, prompt, [judgedBefore])).not.toContain('My picks then:')
  })
})

describe('joke counts in the AI copy', () => {
  it('splits planned and extra time when the drill was extended', () => {
    const extended: Session = {
      ...session,
      endsAt: null,
      plannedEndsAt: start + 120_000,
      finishedAt: start + 240_000,
      lines: [
        { slot: 0, structure: '', text: 'a', at: 30_000 },
        { slot: 1, structure: '', text: 'b', at: 110_000 },
        { slot: 2, structure: '', text: 'c', at: 200_000 },
      ],
    }
    const text = stage1ForAI(extended, prompt)
    expect(text).toContain('Drill: 2 min planned, then no limit, took 4:00 in total')
    expect(text).toContain('Jokes written: 3 jokes (2 in the planned 2 min, 1 in extra time), 0.8 per minute')
    expect(text).toContain('how many jokes I wrote and how many are usable')
  })
})
