/**
 * Finding this week's memes for a drill prompt: the page searches the web
 * (Firecrawl connector, via the artifact's `mcp` capability), then Claude
 * picks one real result and turns it into a situation to write jokes about.
 */
import type { IdeaTheme } from './ideaPrompt'

export interface SearchHit {
  title: string
  url: string
  description: string
  /** e.g. "2 days ago" (news results) */
  date: string
}

const QUERY: Record<IdeaTheme, string> = {
  meme: 'viral meme India',
  trending: 'viral trend India internet',
  office: 'viral office meme India',
  family: 'viral Indian family meme',
  college: 'viral college students meme India',
}

/** Input for the Firecrawl `firecrawl_search` tool: last week's news and web results. */
export function searchInput(theme: IdeaTheme): Record<string, unknown> {
  return {
    query: QUERY[theme],
    objective: 'Find memes trending in India this week to turn into a joke-writing practice prompt.',
    sources: ['news', 'web'],
    tbs: 'qdr:w',
    limit: 8,
    domainTools: false,
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Reads search hits from the tool's payload; keeps https links only, de-duplicated, news first. */
export function parseSearchPayload(payload: unknown, max = 12): SearchHit[] {
  if (typeof payload !== 'object' || payload === null) return []
  const data = (payload as { data?: unknown }).data
  if (typeof data !== 'object' || data === null) return []
  const groups = data as { news?: unknown; web?: unknown }
  const rows = [...(Array.isArray(groups.news) ? groups.news : []), ...(Array.isArray(groups.web) ? groups.web : [])]
  const seen = new Set<string>()
  const hits: SearchHit[] = []
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue
    const r = row as Record<string, unknown>
    const url = str(r.url)
    const title = str(r.title)
    if (!url.startsWith('https://') || !title || seen.has(url)) continue
    seen.add(url)
    hits.push({ title: title.slice(0, 200), url, description: str(r.description ?? r.snippet).slice(0, 300), date: str(r.date) })
    if (hits.length >= max) break
  }
  return hits
}

/** Request for Claude: pick ONE specific meme from these real results and build a situation from it. */
export function buildMemeIdeaRequest(theme: IdeaTheme, hits: SearchHit[], avoid: string[] = []): string {
  const lines = [
    "I'm practising real-time humour. Below are this week's web search results about memes in India.",
    'Pick ONE specific meme or viral moment from them (not a generic "meme compilation") and turn it into a prompt for me to write jokes about.',
    theme === 'meme' || theme === 'trending'
      ? 'Any everyday setting is fine.'
      : `Set the situation in ${theme === 'office' ? 'office or work life' : theme === 'family' ? 'Indian family life' : 'college or hostel life'}.`,
    'Rules:',
    '- Do NOT write any jokes or punchlines yourself.',
    "- Describe the meme in 1-2 sentences (what it shows or says, and why it's going around) so I understand it without seeing it.",
    '- Then give a new everyday situation (2-3 short sentences, simple Hinglish or English) where that meme fits. Concrete: who, where, one odd detail.',
    '- Prefer non-political memes. If you use a political one, keep the situation about everyday life, not about politicians or parties.',
    "- Nothing that targets someone's body, appearance, religion or caste, and no private individuals.",
    '- Use only what the results say. Do not invent details about the meme.',
  ]
  const recent = avoid.map((a) => a.trim()).filter(Boolean).slice(0, 10)
  if (recent.length > 0) lines.push('Pick something different from these, which I already used or saw:', ...recent.map((a) => `- ${a.slice(0, 200)}`))
  lines.push('', 'Search results:')
  hits.forEach((h, i) => {
    lines.push(`[${i + 1}] ${h.title}${h.date ? ` (${h.date})` : ''}`)
    if (h.description) lines.push(`    ${h.description}`)
    lines.push(`    ${h.url}`)
  })
  lines.push(
    '',
    'Reply with only a JSON object, no other text:',
    '{"title": "the meme\'s name, 2-6 words", "meme": "what the meme is", "situation": "the situation", "source": 1}',
    '"source" is the number of the result you used.',
  )
  return lines.join('\n')
}

/** The search result Claude says it used, if the number is valid. */
export function sourceHit(value: unknown, hits: SearchHit[]): SearchHit | null {
  if (typeof value !== 'object' || value === null) return null
  const n = Number((value as { source?: unknown }).source)
  return Number.isInteger(n) && n >= 1 && n <= hits.length ? hits[n - 1] : null
}
