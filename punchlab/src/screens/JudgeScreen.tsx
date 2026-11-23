import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BigButton } from '../components/BigButton'
import { CharCount } from '../components/CharCount'
import { RatingPicker } from '../components/RatingPicker'
import { repo } from '../db/repo'
import type { DrillLine, JudgePick, Session } from '../types'

const MAX_PICKS = 2

interface Draft {
  rewrite: string
  rating: number | null
}

export function JudgeScreen() {
  const id = Number(useParams().id)
  const session = useLiveQuery(() => repo.getSession(id), [id], null)

  if (session === null) return null
  if (!session) return <Navigate to="/" replace />
  if (session.status === 'drilling') return <Navigate to={`/drill/${id}`} replace />
  if (session.status === 'done') return <Navigate to="/" replace />
  return <Judge key={id} session={session} />
}

function Judge({ session }: { session: Session }) {
  const navigate = useNavigate()
  const candidates = session.lines.filter((l) => l.text.length > 0)
  const needed = Math.min(MAX_PICKS, candidates.length)
  const [drafts, setDrafts] = useState<Map<number, Draft>>(new Map())
  const [saving, setSaving] = useState(false)

  const picked = candidates.filter((l) => drafts.has(l.slot))
  const ready = picked.length === needed && picked.every((l) => drafts.get(l.slot)?.rating != null)

  function toggle(line: DrillLine) {
    setDrafts((prev) => {
      const next = new Map(prev)
      if (next.has(line.slot)) next.delete(line.slot)
      else if (next.size < MAX_PICKS) next.set(line.slot, { rewrite: '', rating: null })
      return next
    })
  }

  function update(slot: number, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const current = prev.get(slot)
      if (!current) return prev
      return new Map(prev).set(slot, { ...current, ...patch })
    })
  }

  async function save() {
    if (!ready || saving) return
    setSaving(true)
    const picks: JudgePick[] = picked.map((l) => {
      const d = drafts.get(l.slot)!
      return { slot: l.slot, original: l.text, rewrite: d.rewrite.trim(), rating: d.rating! }
    })
    await repo.saveJudgement(session.id!, picks)
    navigate(`/sessions/${session.id}`, { replace: true, state: { saved: true } })
  }

  const hint =
    needed === 0
      ? 'No lines this time. Save to keep the session.'
      : picked.length < needed
        ? `Pick your best ${needed} (${picked.length}/${needed})`
        : ready
          ? 'Ready to save'
          : 'Rate each pick 1–5'

  return (
    <AppShell
      title="Judge"
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm text-muted">{hint}</p>
          <BigButton onClick={save} disabled={!ready || saving}>
            Save session
          </BigButton>
        </div>
      }
    >
      <ol className="flex flex-col gap-3">
        {candidates.map((line) => {
          const draft = drafts.get(line.slot)
          const selected = draft !== undefined
          const full = !selected && drafts.size >= MAX_PICKS
          return (
            <li key={line.slot} className={`rounded-2xl border ${selected ? 'border-accent bg-surface' : 'border-line'}`}>
              <button
                type="button"
                aria-pressed={selected}
                disabled={full}
                onClick={() => toggle(line)}
                className="flex min-h-14 w-full flex-col items-start gap-1 p-3 text-left disabled:opacity-40"
              >
                <span className={`text-sm font-semibold ${selected ? 'text-accent' : 'text-muted'}`}>
                  {selected ? '★ ' : ''}
                  {line.slot + 1}. {line.structure}
                </span>
                <span className="whitespace-pre-wrap break-words text-lg">{line.text}</span>
              </button>

              {draft && (
                <div className="flex flex-col gap-3 border-t border-line p-3">
                  <label className="flex flex-col gap-2">
                    <span className="text-muted">Rewrite (optional)</span>
                    <textarea
                      value={draft.rewrite}
                      onChange={(e) => update(line.slot, { rewrite: e.target.value })}
                      rows={3}
                      autoCapitalize="sentences"
                      placeholder="Tighter version…"
                      className="w-full resize-none rounded-xl bg-bg p-3 text-lg outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent"
                    />
                  </label>
                  <div className="flex justify-end gap-4">
                    <CharCount text={line.text} label="Original" />
                    <CharCount text={draft.rewrite} label="Rewrite" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-muted">How funny? (1–5)</span>
                    <RatingPicker
                      label={`Rating for line ${line.slot + 1}`}
                      value={draft.rating}
                      onChange={(rating) => update(line.slot, { rating })}
                    />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </AppShell>
  )
}
