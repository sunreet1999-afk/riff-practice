import { useEffect, useRef, useState } from 'react'
import { repo } from '../db/repo'
import { PERMANENT_SAMPLE_ERRORS, getSample, sampleErrorCode, type SampleFn } from '../lib/claudeSample'
import { IDEA_THEMES, buildIdeaRequest, buildSearchRequest, ideaToPromptText, parseIdea, type Idea, type IdeaTheme } from '../lib/ideaPrompt'
import { copyText } from '../lib/share'

interface IdeaHelperProps {
  /** Puts the chosen idea into the prompt box (still editable). */
  onUse: (text: string) => void
}

type AskState =
  | { kind: 'idle' }
  | { kind: 'thinking' }
  | { kind: 'idea'; idea: Idea }
  | { kind: 'error'; message: string }

function errorMessage(code: string): string {
  if (code === 'rate_limited') return 'Too many requests right now. Try again in a little while.'
  if (code === 'session_expired') return 'Sign in to Claude again, then try.'
  if (code === 'refused') return "Claude couldn't make that one. Try another theme."
  return "Couldn't get an idea this time. Try again."
}

/** "Need an idea?": ask Claude in the app (artifact only) or copy a web-search request for ChatGPT / Claude chat. */
export function IdeaHelper({ onUse }: IdeaHelperProps) {
  const [theme, setTheme] = useState<IdeaTheme>('meme')
  const [sample, setSample] = useState<SampleFn | null>(null)
  const [ask, setAsk] = useState<AskState>({ kind: 'idle' })
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle')
  const ctl = useRef<AbortController | null>(null)

  useEffect(() => {
    let alive = true
    void getSample().then((s) => {
      if (alive) setSample(() => s)
    })
    return () => {
      alive = false
      ctl.current?.abort()
    }
  }, [])

  async function askClaude(fresh: boolean) {
    if (!sample) return
    ctl.current?.abort()
    const controller = new AbortController()
    ctl.current = controller
    setAsk({ kind: 'thinking' })
    try {
      const avoid = await repo.listRecentPromptTexts()
      const shown = ask.kind === 'idea' ? [ask.idea.situation] : []
      // "Another one" must really ask again, so it skips the answer cache.
      const options = fresh
        ? { modelTier: 'default' as const, cache: false, signal: controller.signal }
        : { modelTier: 'default' as const, signal: controller.signal }
      const value = await sample.json(buildIdeaRequest(theme, [...shown, ...avoid]), options)
      const idea = parseIdea(value)
      setAsk(idea ? { kind: 'idea', idea } : { kind: 'error', message: errorMessage('invalid_json') })
    } catch (err) {
      const code = sampleErrorCode(err)
      if (code === 'cancelled') return setAsk({ kind: 'idle' })
      if (PERMANENT_SAMPLE_ERRORS.has(code)) {
        setSample(null)
        return setAsk({ kind: 'idle' })
      }
      setAsk({ kind: 'error', message: errorMessage(code) })
    }
  }

  async function copyRequest() {
    setCopied(await copyText(buildSearchRequest(theme)))
  }

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
            onClick={() => setTheme(t.theme)}
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
          {ask.kind !== 'idea' && (
            <button
              type="button"
              onClick={() => void askClaude(false)}
              disabled={ask.kind === 'thinking'}
              className="min-h-14 rounded-2xl bg-surface text-lg font-semibold text-accent active:bg-line disabled:opacity-60"
            >
              {ask.kind === 'thinking' ? 'Claude is thinking…' : '✨ Ask Claude for a prompt'}
            </button>
          )}
          {ask.kind === 'thinking' && (
            <button type="button" onClick={() => ctl.current?.abort()} className="min-h-12 text-sm text-muted">
              Stop
            </button>
          )}
          {ask.kind === 'error' && (
            <p role="status" className="text-sm text-red-400">
              {ask.message}
            </p>
          )}
          {ask.kind === 'idea' && (
            <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
              {ask.idea.title && <p className="font-semibold text-accent">{ask.idea.title}</p>}
              {ask.idea.meme && (
                <p className="text-sm text-muted">
                  <span className="font-semibold">Meme: </span>
                  {ask.idea.meme}
                </p>
              )}
              <p className="whitespace-pre-wrap break-words text-lg">{ask.idea.situation}</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void askClaude(true)}
                  className="min-h-12 rounded-xl border border-line font-semibold active:bg-line"
                >
                  ↻ Another one
                </button>
                <button
                  type="button"
                  onClick={() => onUse(ideaToPromptText(ask.idea))}
                  className="min-h-12 rounded-xl bg-accent font-semibold text-accent-ink active:brightness-90"
                >
                  Use this
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted">Claude works from what it knows here; it can't search the web inside the app.</p>
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
          ? "Copy is blocked here. Ask ChatGPT or Claude to search for a trending meme and give you a situation."
          : 'Paste it in ChatGPT or Claude chat. It searches what’s trending now; paste its SITUATION and MEME lines into the box above.'}
      </p>
    </section>
  )
}
