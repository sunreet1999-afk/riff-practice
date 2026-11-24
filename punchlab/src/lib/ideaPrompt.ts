/**
 * Getting a drill prompt from an AI: either in-app (Claude via the artifact's
 * `sample` capability, from its own knowledge) or by copying a request into
 * ChatGPT / Claude chat, which can search the web for what's trending now.
 */

export type IdeaTheme = 'dank' | 'hostel' | 'family' | 'office' | 'trending'

export const IDEA_THEMES: { theme: IdeaTheme; label: string }[] = [
  { theme: 'dank', label: 'Desi dank' },
  { theme: 'hostel', label: 'Hostel / dosti' },
  { theme: 'family', label: 'Family' },
  { theme: 'office', label: 'Office' },
  { theme: 'trending', label: 'Trending' },
]

export const DEFAULT_IDEA_THEME: IdeaTheme = 'dank'

const THEME_ASK: Record<IdeaTheme, string> = {
  dank: 'a well-known desi meme format from Indian dank meme pages and reaction videos (the "Tanmay Bhat reacts" kind), e.g. famous Bollywood or TV dialogue templates and reaction faces',
  hostel: 'boys hostel, PG or college dosti life in India',
  family: 'Indian family life (mummy, papa, relatives, shaadi)',
  office: 'office or work life in India',
  trending: 'something viral on Indian meme pages right now',
}

/** The kind of humour the user wants: silly, crude, relatable "boys level" stuff, not clever or newsy. */
const TONE = [
  'Tone: desi dank, "boys level" humour. Silly, crude, relatable and a bit ghatiya, the kind of thing friends forward in the group chat.',
  'Not sophisticated, not news or politics, not a clever think-piece.',
  'Gross-out, awkward, dosti-roast and mild double-meaning situations are welcome; nothing sexually explicit.',
]

export type Difficulty = 'easy' | 'medium' | 'tough'

export const DIFFICULTIES: { difficulty: Difficulty; label: string; hint: string }[] = [
  { difficulty: 'easy', label: 'Easy', hint: 'Lots of obvious angles; jokes come fast' },
  { difficulty: 'medium', label: 'Medium', hint: 'A few obvious jokes, the good ones need digging' },
  { difficulty: 'tough', label: 'Tough', hint: 'Plain situation; you have to find the funny' },
]

export const DEFAULT_DIFFICULTY: Difficulty = 'medium'

/**
 * Every prompt must be joke-able. Research on practice suggests the sweet spot is
 * "hard but doable": ideas get more original the longer you keep going on one
 * prompt (serial order effect), but a prompt you stall on stops practice.
 */
const JOKEABLE = [
  'Make it joke-rich: build in a contradiction or something that went wrong, a status gap or awkward social pressure, and one oddly specific detail (a number, brand, name or object).',
  'There must be several different angles to joke from (the people involved, the object, what happens next, what everyone pretends), so I can keep writing for 5 minutes.',
]

const DIFFICULTY_ASK: Record<Difficulty, string> = {
  easy: 'Difficulty EASY: a very familiar situation with an obvious, exaggerated conflict, so the first jokes come immediately and there are 6+ clear angles.',
  medium: 'Difficulty MEDIUM: a familiar situation with one unusual twist; 2-3 jokes should be obvious, and the better ones should need some digging.',
  tough: 'Difficulty TOUGH: an ordinary, low-drama moment with no obvious punchline. It must still contain one specific odd detail or tension, so the funny is there for someone who looks closely.',
}

const RULES = [
  'Give a situation to write jokes about. Do NOT write any jokes or punchlines yourself.',
  'Make it concrete: who, where, one odd detail. 2-3 short sentences.',
  'Write the situation in simple Hinglish, the way friends in India talk.',
  ...TONE,
  "Keep it about the situation. Nothing that targets someone's body, appearance, religion or caste, and no real private individuals.",
]

export interface Idea {
  title: string
  /** What the meme looks like and its usual caption pattern; empty when there's no meme. */
  meme: string
  situation: string
}

/** Request for Claude inside the app. Claude can't browse here, so it works from what it knows. */
export function buildIdeaRequest(theme: IdeaTheme, avoid: string[] = [], difficulty: Difficulty = DEFAULT_DIFFICULTY): string {
  const lines = [
    `I'm practising real-time humour. Give me one fresh prompt to write jokes about, based on ${THEME_ASK[theme]}.`,
    ...RULES,
    ...JOKEABLE,
    DIFFICULTY_ASK[difficulty],
    theme === 'dank'
      ? 'Name a meme format you are sure exists and describe it in 1-2 sentences (what the image or clip shows and its usual caption), so I can picture it without seeing it. Then give a new everyday situation that fits that meme.'
      : 'If a well-known desi meme format fits, describe it in 1-2 sentences; otherwise leave "meme" as an empty string. Only use meme formats you are sure exist.',
  ]
  const recent = avoid.map((a) => a.trim()).filter(Boolean).slice(0, 10)
  if (recent.length > 0) {
    lines.push('Avoid repeating these prompts I already used:', ...recent.map((a) => `- ${a.slice(0, 200)}`))
  }
  lines.push(
    'Reply with only a JSON object, no other text:',
    '{"title": "3-6 word name", "meme": "description or empty string", "situation": "the situation"}',
  )
  return lines.join('\n')
}

/** Request to paste into ChatGPT / Claude chat, which can search the web for what's trending now. */
export function buildSearchRequest(theme: IdeaTheme, difficulty: Difficulty = DEFAULT_DIFFICULTY): string {
  return [
    `Search the web for a desi meme going viral in India this week (r/IndianDankMemes, Instagram meme pages, "Tanmay Bhat reacts" type videos)${theme === 'dank' || theme === 'trending' ? '' : ` that fits ${THEME_ASK[theme]}`}, and turn it into one prompt for my joke-writing practice.`,
    ...RULES,
    ...JOKEABLE,
    DIFFICULTY_ASK[difficulty],
    '',
    'Reply in exactly this format, nothing else:',
    'SITUATION: <2-3 sentences>',
    'MEME: <what the meme image shows and its caption pattern, or "none">',
    'SOURCE: <link where I can see it>',
  ].join('\n')
}

/** Checks Claude's JSON reply; returns null if it isn't a usable idea. */
export function parseIdea(value: unknown): Idea | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const situation = typeof v.situation === 'string' ? v.situation.trim() : ''
  if (!situation) return null
  return {
    title: typeof v.title === 'string' ? v.title.trim() : '',
    meme: typeof v.meme === 'string' ? v.meme.trim() : '',
    situation,
  }
}

/** The text that goes into the prompt box. */
export function ideaToPromptText(idea: Idea): string {
  return idea.meme ? `${idea.situation}\n\nMeme: ${idea.meme}` : idea.situation
}

/** Used by the meme-search request too. */
export function jokeabilityRules(difficulty: Difficulty): string[] {
  return [...JOKEABLE, DIFFICULTY_ASK[difficulty]]
}
