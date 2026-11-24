import { formatDay } from './format'
import { reactionMeta } from './reactions'
import { describeDrillLength } from './timer'
import type { Prompt, Reaction, Session, SessionWithPrompt } from '../types'

/**
 * Copy-ready text for ChatGPT / Claude: an analysis request for the stage,
 * then the drill data, then up to 3 earlier drills so the AI can say honestly
 * whether I'm improving (chat assistants don't remember earlier chats).
 * Lines keep the app's numbering so "line 5" means the same line everywhere.
 */

/** Earlier drills are trimmed to keep the paste a manageable size. */
const MAX_PREVIOUS_LINES = 15

const STYLE = [
  "Be direct and specific. Don't praise lines that don't work.",
  'Reply in the language I wrote in (English or Hinglish).',
]

function promptLine(prompt: Prompt | undefined): string {
  if (!prompt) return 'Prompt: (missing)'
  if (prompt.kind === 'image') return `Prompt: [photo, attached separately]${prompt.text ? ` Caption: ${prompt.text}` : ''}`
  return `Prompt: ${prompt.text}`
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function drillBlock(session: Session, prompt: Prompt | undefined): string[] {
  const written = session.lines.filter((l) => l.text)
  const out = [
    promptLine(prompt),
    `Drill: ${describeDrillLength(session)}, ${plural(written.length, 'line')} written (skipped lines left out)`,
    '',
    'Lines:',
  ]
  for (const l of written) out.push(`${l.slot + 1}. ${l.text}`)
  return out
}

function picksBlock(session: Session, heading: string): string[] {
  const out = ['', heading]
  for (const p of session.picks) {
    out.push(`- Line ${p.slot + 1}, self-rating ${p.rating}/5`)
    out.push(`  Original: ${p.original}`)
    if (p.rewrite) out.push(`  My rewrite: ${p.rewrite}`)
  }
  return out
}

function previousBlock(previous: SessionWithPrompt[], withPicks: boolean): string[] {
  if (previous.length === 0) return ['', 'Previous drills: none yet. This is my first drill.']
  const out = ['', `Previous drills, newest first (${previous.length}):`]
  previous.forEach(({ session, prompt }, i) => {
    const written = session.lines.filter((l) => l.text)
    out.push('')
    out.push(`[Earlier drill ${i + 1}] ${formatDay(session.startedAt)}, ${describeDrillLength(session)}, ${plural(written.length, 'line')}`)
    out.push(promptLine(prompt))
    for (const l of written.slice(0, MAX_PREVIOUS_LINES)) out.push(`${l.slot + 1}. ${l.text}`)
    if (written.length > MAX_PREVIOUS_LINES) out.push(`(+${written.length - MAX_PREVIOUS_LINES} more lines not shown)`)
    if (withPicks && session.picks.length > 0) out.push(...picksBlock(session, 'My picks then:').slice(1))
  })
  return out
}

/** The honest progress meter, asked for in both stages. */
function meterRequest(n: number, focus: string, previousCount: number): string[] {
  return [
    `${n}. Progress meter. Be honest. Compare ${focus} with my previous drills below. The prompts differ, so judge the skill, not the topic.`,
    '   Give exactly this, then 2–3 sentences of evidence citing line numbers:',
    '   This drill: X/10',
    previousCount > 0
      ? `   Earlier drills: ${Array.from({ length: previousCount }, () => 'X/10').join(', ')} (newest first)`
      : '   Earlier drills: none, this is the baseline',
    '   Meter: [■■■■■■□□□□] X/10 · Trend: Improving / Same / Declining',
    "   Don't inflate scores to encourage me. If I haven't improved, say so plainly.",
  ]
}

/** Stage 1: the raw drill, with a request to analyse it and rate my progress. */
export function stage1ForAI(session: Session, prompt: Prompt | undefined, previous: SessionWithPrompt[] = []): string {
  return [
    "I'm practising real-time humour with timed writing drills. Below is one drill: a prompt and every line I wrote, without editing.",
    '',
    'Analyse it as a comedy writing coach:',
    '1. For each line, name the joke structure it uses (e.g. exaggeration, reversal, misdirection, wordplay, comparison, specific detail), or say "no clear joke".',
    '2. Pick my 2 strongest lines and say in one sentence each why they work.',
    '3. For those 2, suggest a tighter version (shorter, with the punch at the end).',
    '4. Point out patterns: what I keep repeating, and which angles on the situation I missed.',
    "5. If a line only mocks someone's body, appearance, religion or caste, flag it and suggest an angle on the situation instead.",
    ...meterRequest(6, 'this drill (number of usable jokes, sharpness of angles, tightness of wording)', previous.length),
    '7. End with one specific thing to try in my next drill.',
    ...STYLE,
    '',
    '--- THIS DRILL ---',
    ...drillBlock(session, prompt),
    ...previousBlock(previous, false),
    '---',
  ].join('\n')
}

/** Stage 2: the drill plus my picks, rewrites, self-ratings and reactions, with a review and progress meter. */
export function stage2ForAI(
  session: Session,
  prompt: Prompt | undefined,
  reactions: Reaction[] = [],
  previous: SessionWithPrompt[] = [],
): string {
  const reacted = reactions.length > 0
  const reactionLines = reacted
    ? ['', 'How it landed when I shared it:', ...reactions.map((r) => `- Line ${r.slot + 1}: ${reactionMeta(r.reaction).label}${r.note ? ` (${r.note})` : ''}`)]
    : []
  const steps = [
    '1. Do you agree with my picks? If another line is stronger, name it and say why.',
    '2. For each rewrite: is it better than the original? Suggest one improved version.',
    '3. Give your own 1–5 rating for each pick and say where I over- or under-rate myself.',
    ...(reacted ? ['4. What do the reactions suggest about what lands with my audience?'] : []),
  ]
  const next = steps.length + 1
  return [
    `I'm practising real-time humour with timed writing drills. Below is one drill I've already judged myself: all my lines, the ${session.picks.length} I picked as best, my rewrites and my self-ratings (1–5)${reacted ? ', and how real people reacted when I shared them' : ''}.`,
    '',
    'Review my judgement as a comedy writing coach:',
    ...steps,
    ...meterRequest(next, 'my best lines and my judgement (how well I pick and rewrite)', previous.length),
    `${next + 1}. One concrete takeaway for my next drill.`,
    ...STYLE,
    '',
    '--- THIS DRILL ---',
    ...drillBlock(session, prompt),
    ...picksBlock(session, 'My picks:'),
    ...reactionLines,
    ...previousBlock(previous, true),
    '---',
  ].join('\n')
}
