import { useEffect, useRef, useState } from 'react'
import { repo } from '../db/repo'
import { PERMANENT_SEARCH_ERRORS, SEARCH_TOOL, getSearchConnector, mcpErrorCode, searchErrorMessage, type SearchConnector } from '../lib/claudeMcp'
import { PERMANENT_SAMPLE_ERRORS, getSample, sampleErrorCode, type SampleFn } from '../lib/claudeSample'
import { IDEA_THEMES, buildIdeaRequest, buildSearchRequest, ideaToPromptText, parseIdea, type Idea, type IdeaTheme } from '../lib/ideaPrompt'
import { buildMemeIdeaRequest, parseSearchPayload, searchInput, sourceHit, type SearchHit } from '../lib/memeSearch'
import { copyText } from '../lib/share'
import { IdeaCard } from './IdeaCard'

interface IdeaHelperProps {
  /** Puts the chosen idea into the prompt box (still editable). */
  onUse: (text: string) => void
}

type AskState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'thinking' }
  | { kind: 'idea'; idea: Idea; source: SearchHit | null }
  | { kind: 'error'; message: string }

function sampleErrorMessage(code: string): string {
  if (code === 'rate_limited') return 'Too many requests right now. Try again in a little while.'
  if (code === 'session_expired') return 'Sign in to Claude again, then try.'
  if (code === 'refused') return "Claude couldn't make that one. Try another theme."
  return "Couldn't get an idea this time. Try again."
}

/**
 * "Need an idea?": in the Claude Artifact, search this week's memes (Firecrawl
 * connector) and let Claude turn one into a prompt, or ask Claude from its own
 * knowledge; everywhere, copy a web-search request for ChatGPT / Claude chat.
 */
export function IdeaHelper({ onUse }: IdeaHelperProps) {
  const [theme, setTheme] = useState<IdeaTheme>('meme')
  const [sample, setSample] = useState<SampleFn | null>(null)
  const [search, setSearch] = useState<SearchConnector | null>(null)
  const [searchNote, setSearchNote] = useState('')
  const [ask, setAsk] = useState<AskState>({ kind: 'idle' })
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle')
  const ctl = useRef<AbortController | null>(null)
  // Search results per theme, reused by "Another one" so it doesn't spend another search.
  const hitsByTheme = useRef(new Map<IdeaTheme, SearchHit[]>())
  const shown = useRef<string[]>([])

  useEffect(() => {
    let alive = true
    void getSample().then((s) => {
      if (alive) setSample(() => s)
    })
    void getSearchConnector().then((c) => {
      if (alive) setSearch(c)
    })
    return () => {
      alive = false
      ctl.current?.abort()
    }
  }, [])

  async function findHits(connector: SearchConnector, signal: AbortSignal): Promise<SearchHit[] | null> {
    const cached = hitsByTheme.current.get(theme)
    if (cached) return cached
    setAsk({ kind: 'searching' })
    try {
      const result = await connector.mcp.callTool(connector.server, SEARCH_TOOL, searchInput(theme), { signal })
      const hits = parseSearchPayload(result.payload)
      hitsByTheme.current.set(theme, hits)
      return hits
    } catch (err) {
      const code = mcpErrorCode(err)
      if (code === 'cancelled') {
        setAsk({ kind: 'idle' })
        return null
      }
      const message = searchErrorMessage(code, connector.server)
      if (PERMANENT_SEARCH_ERRORS.has(code)) {
        setSearch(null)
        setSearchNote(message)
        setAsk({ kind: 'idle' })
      } else {
        setAsk({ kind: 'error', message })
      }
      return null
    }
  }

  async function getIdea(fresh: boolean) {
    if (!sample) return
    ctl.current?.abort()
    const controller = new AbortController()
    ctl.current = controller
    try {
      const avoid = [...shown.current, ...(await repo.listRecentPromptTexts())]
      let request: string
      let hits: SearchHit[] = []
      if (search) {
        const found = await findHits(search, controller.signal)
        if (!found) return
        if (found.length === 0) {
          setAsk({ kind: 'error', message: 'No memes found this week for this theme. Try another theme.' })
          return
        }
        hits = found
        request = buildMemeIdeaRequest(theme, hits, avoid)
      } else {
        request = buildIdeaRequest(theme, avoid)
      }
      setAsk({ kind: 'thinking' })
      // "Another one" must really ask again, so it skips the answer cache.
      const options = fresh
        ? { modelTier: 'default' as const, cache: false, signal: controller.signal }
        : { modelTier: 'default' as const, signal: controller.signal }
      const value = await sample.json(request, options)
      const idea = parseIdea(value)
      if (!idea) return setAsk({ kind: 'error', message: sampleErrorMessage('invalid_json') })
      shown.current = [idea.title, idea.situation, ...shown.current].filter(Boolean).slice(0, 8)
      setAsk({ kind: 'idea', idea, source: search ? sourceHit(value, hits) : null })
    } catch (err) {
      const code = sampleErrorCode(err)
      if (code === 'cancelled') return setAsk({ kind: 'idle' })
      if (PERMANENT_SAMPLE_ERRORS.has(code)) {
        setSample(null)
        return setAsk({ kind: 'idle' })
      }
      setAsk({ kind: 'error', message: sampleErrorMessage(code) })
    }
  }

  function chooseTheme(t: IdeaTheme) {
    setTheme(t)
    if (ask.kind === 'error') setAsk({ kind: 'idle' })
  }

  function use(idea: Idea, source: SearchHit | null) {
    onUse(source ? `${ideaToPromptText(idea)}\nSource: ${source.url}` : ideaToPromptText(idea))
  }

  async function copyRequest() {
    setCopied(await copyText(buildSearchRequest(theme)))
  }

  const busy = ask.kind === 'searching' || ask.kind === 'thinking'
  const label =
    ask.kind === 'searching'
      ? "Searching this week's memes…"
      : ask.kind === 'thinking'
        ? 'Claude is picking one…'
        : search
          ? "🔎 Find this week's meme & make a prompt"
          : '✨ Ask Claude for a prompt'

  return (
    <section aria-labelledby="idea-title" className="flex flex-col gap-3 rounded-2xl border border-line p-4">
      <h2 id="idea-title" className="font-semibold">
        Need an idea?
      </h2>
      <div role="radiogroup" aria-label="Idea theme" className="flex flex-wrap gap-2">
        {IDEA_THEMES.map((t) => (
          <button
            key={t.theme}
            type="button"
            role="radio"
            aria-checked={theme === t.theme}
            onClick={() => chooseTheme(t.theme)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              theme === t.theme ? 'bg-accent text-accent-ink' : 'border border-line text-ink active:bg-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sample && (
        <div className="flex flex-col gap-2">
          {ask.kind === 'idea' ? (
            <IdeaCard
              idea={ask.idea}
              source={ask.source}
              onAnother={() => void getIdea(true)}
              onUse={() => use(ask.idea, ask.source)}
            />
          ) : (
            <button
              type="button"
              onClick={() => void getIdea(false)}
              disabled={busy}
              className="min-h-14 rounded-2xl bg-surface px-3 text-lg font-semibold text-accent active:bg-line disabled:opacity-60"
            >
              {label}
            </button>
          )}
          {busy && (
            <button type="button" onClick={() => ctl.current?.abort()} className="min-h-12 text-sm text-muted">
              Stop
            </button>
          )}
          {ask.kind === 'error' && (
            <p role="status" className="text-sm text-red-400">
              {ask.message}
            </p>
          )}
          <p className="text-xs text-muted">
            {search
              ? `Searches the last week of news and web with your ${search.server} connector (uses its credits), then Claude picks one meme.`
              : "Claude works from what it knows here; it can't search the web inside the app."}
          </p>
          {searchNote && !search && <p className="text-xs text-muted">{searchNote}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={() => void copyRequest()}
        className="min-h-12 rounded-xl border border-line px-3 font-semibold active:bg-surface"
      >
        {copied === 'copied' ? '✓ Request copied' : 'Copy request for ChatGPT / Claude (web search)'}
      </button>
      <p role="status" className="text-sm text-muted">
        {copied === 'failed'
          ? 'Copy is blocked here. Ask ChatGPT or Claude to search for a trending meme and give you a situation.'
          : 'Paste it in ChatGPT or Claude chat. It searches what’s trending now; paste its SITUATION and MEME lines into the box above.'}
      </p>
    </section>
  )
}
