import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BackLink } from '../components/BackLink'
import { CharCount } from '../components/CharCount'
import { PromptView } from '../components/PromptView'
import { repo } from '../db/repo'
import { formatDay, formatDuration, formatTime } from '../lib/format'
import type { JudgePick, Session } from '../types'

export function SessionDetailScreen() {
  const id = Number(useParams().id)
  const session = useLiveQuery(() => repo.getSession(id), [id], null)
  if (session === null) return null
  if (!session || session.status !== 'done') return <Navigate to="/sessions" replace />
  return <Detail session={session} />
}

function PickCard({ pick, structure }: { pick: JudgePick; structure: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-accent bg-surface p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-accent">
          ★ {pick.slot + 1}. {structure}
        </span>
        <span aria-label={`Rated ${pick.rating} of 5`} className="font-semibold">
          {pick.rating}/5
        </span>
      </div>
      <p className={`whitespace-pre-wrap break-words ${pick.rewrite ? 'text-muted line-through decoration-muted/50' : 'text-lg'}`}>
        {pick.original}
      </p>
      {pick.rewrite && <p className="whitespace-pre-wrap break-words text-lg">{pick.rewrite}</p>}
      {pick.rewrite && (
        <div className="flex justify-end gap-4">
          <CharCount text={pick.original} label="Original" />
          <CharCount text={pick.rewrite} label="Rewrite" />
        </div>
      )}
    </li>
  )
}

function Detail({ session }: { session: Session }) {
  const prompt = useLiveQuery(() => repo.getPrompt(session.promptId), [session.promptId])
  const pickedSlots = new Set(session.picks.map((p) => p.slot))
  const duration = session.finishedAt ? formatDuration(session.finishedAt - session.startedAt) : null

  return (
    <AppShell title="Session" action={<BackLink to="/sessions" />}>
      <p className="text-sm text-muted">
        {formatDay(session.startedAt)} · {formatTime(session.startedAt)}
        {duration && ` · ${duration} min`}
      </p>

      {prompt && (
        <section className="rounded-2xl bg-surface p-4">
          <h2 className="mb-2 text-muted">Prompt</h2>
          <PromptView prompt={prompt} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-muted">Best lines</h2>
        {session.picks.length === 0 ? (
          <p className="text-muted">No lines picked.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {session.picks.map((pick) => (
              <PickCard key={pick.slot} pick={pick} structure={session.lines[pick.slot]?.structure ?? ''} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted">All lines</h2>
        <ol className="flex flex-col gap-2">
          {session.lines.map((line) => (
            <li key={line.slot} className="rounded-2xl border border-line p-3">
              <p className={`text-sm font-semibold ${pickedSlots.has(line.slot) ? 'text-accent' : 'text-muted'}`}>
                {pickedSlots.has(line.slot) ? '★ ' : ''}
                {line.slot + 1}. {line.structure}
              </p>
              <p className={`mt-1 whitespace-pre-wrap break-words ${line.text ? '' : 'italic text-muted'}`}>
                {line.text || 'Skipped'}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  )
}
