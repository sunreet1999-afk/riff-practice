/**
 * Getting a drill prompt from an AI: either in-app (Claude via the artifact's
 * `sample` capability, from its own knowledge) or by copying a request into
 * ChatGPT / Claude chat, which can search the web for what's trending now.
 */

export type IdeaTheme = 'meme' | 'trending' | 'office' | 'family' | 'college'

export const IDEA_THEMES: { theme: IdeaTheme; label: string }[] = [
  { theme: 'meme', label: 'Meme' },
  { theme: 'trending', label: 'Trending' },
  { theme: 'office', label: 'Office' },
  { theme: 'family', label: 'Family' },
  { theme: 'college', label: 'College' },
]

const THEME_ASK: Record<IdeaTheme, string> = {
  meme: 'a well-known meme format popular in India (Hindi, Hinglish or English internet)',
  trending: 'a recent, widely discussed topic in India (news, cricket, films, apps, viral moments)',
  office: 'office or work life in India',
  family: 'Indian family life',
  college: 'college or hostel life in India',
}

const RULES = [
  'Give a situation to write jokes about. Do NOT write any jokes or punchlines yourself.',
  'Make it concrete: who, where, one odd detail. 2-3 short sentences.',
  'Write the situation in simple Hinglish or English, the way people in India talk.',
  "Keep it about the situation. Nothing that targets someone's body, appearance, religion or caste, and no private individuals.",
]

export interface Idea {
  title: string
  /** What the meme looks like and its usual caption pattern; empty when there's no meme. */
  meme: string
  situation: string
}

/** Request for Claude inside the app. Claude can't browse here, so it works from what it knows. */
export function buildIdeaRequest(theme: IdeaTheme, avoid: string[] = []): string {
  const lines = [
    `I'm practising real-time humour. Give me one fresh prompt to write jokes about, based on ${THEME_ASK[theme]}.`,
    ...RULES,
    theme === 'meme'
      ? 'Describe the meme in 1-2 sentences (what the image shows and its usual caption pattern) so I can picture it without seeing it, then give a new everyday situation that fits that meme.'
      : 'Leave "meme" as an empty string unless a well-known meme fits naturally.',
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
export function buildSearchRequest(theme: IdeaTheme): string {
  return [
    `Search the web for ${theme === 'meme' ? 'a meme that is trending in India this week' : `something trending in India this week about ${THEME_ASK[theme]}`}, and turn it into one prompt for my joke-writing practice.`,
    ...RULES,
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
