import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BackLink } from '../components/BackLink'
import { PickCard } from '../components/PickCard'
import { PromptView } from '../components/PromptView'
import { Toast } from '../components/Toast'
import { repo } from '../db/repo'
import { formatDay, formatDuration, formatTime } from '../lib/format'
import type { Reaction, Session } from '../types'

export function SessionDetailScreen() {
  const id = Number(useParams().id)
  const session = useLiveQuery(() => repo.getSession(id), [id], null)
  if (session === null) return null
  if (!session || session.status !== 'done') return <Navigate to="/sessions" replace />
  return <Detail session={session} />
}

function Detail({ session }: { session: Session }) {
  const prompt = useLiveQuery(() => repo.getPrompt(session.promptId), [session.promptId])
  const reactions = useLiveQuery(() => repo.listReactions(session.id!), [session.id], [] as Reaction[])
  const saved = (useLocation().state as { saved?: boolean } | null)?.saved === true
  const pickedSlots = new Set(session.picks.map((p) => p.slot))
  const duration = session.finishedAt ? formatDuration(session.finishedAt - session.startedAt) : null

  return (
    <AppShell title="Session" action={<BackLink to="/sessions" />}>
      {saved && <Toast message="Session saved. Share your best lines and log how they land." />}
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
              <PickCard
                key={pick.slot}
                sessionId={session.id!}
                pick={pick}
                structure={session.lines[pick.slot]?.structure ?? ''}
                reactions={reactions.filter((r) => r.slot === pick.slot)}
              />
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
