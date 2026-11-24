import { DEFAULT_DIFFICULTY, jokeabilityRules, type Difficulty } from './ideaPrompt'
/**
 * Finding this week's memes for a drill prompt: the page searches the web
 * (Firecrawl connector, via the artifact's `mcp` capability), then Claude
 * picks one real result and turns it into a situation to write jokes about.
 */

export interface SearchHit {
  title: string
  url: string
  description: string
  /** e.g. "2 days ago" (news results) */
  date: string
}

/** Two searches over the last week: Indian dank meme posts, and viral-meme news. */
export function searchInputs(): Record<string, unknown>[] {
  const base = {
    objective: "Find this week's popular desi dank memes to turn into joke-writing practice prompts.",
    tbs: 'qdr:w',
    limit: 8,
    domainTools: false,
  }
  return [
    { ...base, query: 'site:reddit.com/r/IndianDankMemes', sources: ['web'] },
    { ...base, query: 'viral meme India', sources: ['news'] },
  ]
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

/** Request for Claude: pick the funniest real result and build a desi, boys-level situation from it. */
export function buildMemeIdeaRequest(hits: SearchHit[], avoid: string[] = [], difficulty: Difficulty = DEFAULT_DIFFICULTY): string {
  const lines = [
    "I'm practising real-time humour. Below are this week's search results: posts from r/IndianDankMemes and news about viral memes in India.",
    'Pick the ONE result that is the silliest, most relatable desi meme or viral moment, and turn it into a prompt for me to write jokes about.',
    'Rules:',
    '- Do NOT write any jokes or punchlines yourself.',
    '- Tone: desi dank, "boys level" humour. Silly, crude, relatable, a bit ghatiya. Skip anything sophisticated, newsy or political.',
    "- Use only what the results say. A Reddit title alone often doesn't explain the meme: only pick it if the title makes clear what's funny, and never invent what the image shows.",
    "- Describe the meme or moment in 1-2 sentences (what it is and why it's going around).",
    '- Then give a new everyday situation (2-3 short sentences, simple Hinglish) where it fits: boys hostel, dosti, family, office. Concrete: who, where, one odd detail.',
    "- Nothing that targets someone's body, appearance, religion or caste; no real private individuals; nothing sexually explicit.",
    ...jokeabilityRules(difficulty).map((r) => `- ${r}`),
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

/** Merges several search payloads into one de-duplicated list. */
export function mergeHits(payloads: unknown[], max = 14): SearchHit[] {
  const seen = new Set<string>()
  const out: SearchHit[] = []
  for (const payload of payloads) {
    for (const hit of parseSearchPayload(payload)) {
      if (seen.has(hit.url)) continue
      seen.add(hit.url)
      out.push(hit)
      if (out.length >= max) return out
    }
  }
  return out
}

/** The search result Claude says it used, if the number is valid. */
export function sourceHit(value: unknown, hits: SearchHit[]): SearchHit | null {
  if (typeof value !== 'object' || value === null) return null
  const n = Number((value as { source?: unknown }).source)
  return Number.isInteger(n) && n >= 1 && n <= hits.length ? hits[n - 1] : null
}
