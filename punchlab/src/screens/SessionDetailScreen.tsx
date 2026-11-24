import { useLiveQuery } from 'dexie-react-hooks'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BackLink } from '../components/BackLink'
import { CopyForAI } from '../components/CopyForAI'
import { PickCard } from '../components/PickCard'
import { PromptView } from '../components/PromptView'
import { Toast } from '../components/Toast'
import { repo } from '../db/repo'
import { lineLabel } from '../lib/lineLabel'
import { stage1ForAI, stage2ForAI } from '../lib/exportText'
import { countJokes, jokesLabel, jokesPerMinute, plannedEnd, wasExtended } from '../lib/drillStats'
import { formatDay, formatTime } from '../lib/format'
import { describeDrillLength } from '../lib/timer'
import type { DrillLine, Reaction, Session, SessionWithPrompt } from '../types'

interface DetailLocationState {
  drillSaved?: boolean
  saved?: boolean
}

export function SessionDetailScreen() {
  const id = Number(useParams().id)
  const session = useLiveQuery(() => repo.getSession(id), [id], null)
  if (session === null) return null
  if (!session) return <Navigate to="/sessions" replace />
  if (session.status === 'drilling') return <Navigate to={`/drill/${id}`} replace />
  return <Detail session={session} />
}

function LineList({ lines, pickedSlots }: { lines: DrillLine[]; pickedSlots?: Set<number> }) {
  return (
    <ol className="flex flex-col gap-2">
      {lines.map((line) => (
        <li key={line.slot} className="rounded-2xl border border-line p-3">
          <p className="text-sm font-semibold text-muted">
            {pickedSlots?.has(line.slot) ? '★ ' : ''}
            {lineLabel(line)}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words">{line.text}</p>
        </li>
      ))}
    </ol>
  )
}

function Detail({ session }: { session: Session }) {
  const prompt = useLiveQuery(() => repo.getPrompt(session.promptId), [session.promptId])
  const reactions = useLiveQuery(() => repo.listReactions(session.id!), [session.id], [] as Reaction[])
  // Earlier drills go into the AI copy so it can rate progress honestly.
  const previous = useLiveQuery(() => repo.listPreviousSessions(session.startedAt), [session.startedAt], [] as SessionWithPrompt[])
  const state = useLocation().state as DetailLocationState | null

  const judged = session.status === 'done'
  const pickedSlots = new Set(session.picks.map((p) => p.slot))
  const written = session.lines.filter((l) => l.text)
  const skipped = session.lines.length - written.length
  const others = written.filter((l) => !pickedSlots.has(l.slot))
  const jokes = countJokes(session)
  const pace = jokesPerMinute(session)
  const firstEnd = plannedEnd(session)
  const plannedMin = firstEnd === null ? null : Math.round((firstEnd - session.startedAt) / 60_000)

  return (
    <AppShell title="Session" action={<BackLink to="/sessions" />}>
      {state?.drillSaved && <Toast message="Stage 1 complete. Drill saved." />}
      {state?.saved && <Toast message="Stage 2 complete. Share your best lines and log how they land." />}

      <p className="text-sm text-muted">
        {formatDay(session.startedAt)} · {formatTime(session.startedAt)} · {describeDrillLength(session)}
      </p>

      <section aria-label="Joke count" className="flex items-center gap-4 rounded-2xl bg-surface p-4">
        <p className="text-4xl font-bold text-accent tabular-nums">{jokes.total}</p>
        <div className="min-w-0 text-sm">
          <p className="text-base font-semibold">{jokes.total === 1 ? 'joke' : 'jokes'} written</p>
          {wasExtended(session) && plannedMin !== null && (
            <p className="text-muted">
              {jokesLabel(jokes.planned)} in the planned {plannedMin} min · {jokes.extra} in extra time
            </p>
          )}
          {pace !== null && <p className="text-muted">{pace} per minute</p>}
        </div>
      </section>

      {prompt && (
        <section className="rounded-2xl bg-surface p-4">
          <h2 className="mb-2 text-muted">Prompt</h2>
          <PromptView prompt={prompt} />
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Stage 1 · Drill</h2>
          <span className="text-sm text-accent">✓ Saved</span>
        </div>
        <CopyForAI label="Copy Stage 1 for ChatGPT / Claude" text={stage1ForAI(session, prompt, previous)} />
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-semibold">Stage 2 · Judge</h2>
          <span className={`text-sm ${judged ? 'text-accent' : 'text-muted'}`}>{judged ? '✓ Done' : 'Optional'}</span>
        </div>
        {judged && (
          <CopyForAI label="Copy Stage 2 for ChatGPT / Claude" text={stage2ForAI(session, prompt, reactions, previous)} />
        )}
        {!judged &&
          (written.length > 0 ? (
            <Link
              to={`/judge/${session.id}`}
              className="flex min-h-14 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-accent-ink active:brightness-90"
            >
              Pick best 2
            </Link>
          ) : (
            <p className="text-sm text-muted">No lines to judge in this drill.</p>
          ))}
      </section>

      {judged && session.picks.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted">Best lines</h2>
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
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-muted">
          {judged ? 'Other lines' : 'All lines'}
          {skipped > 0 && <span className="text-sm"> · {skipped} skipped</span>}
        </h2>
        {(judged ? others : written).length === 0 ? (
          <p className="text-muted">None.</p>
        ) : (
          <LineList lines={judged ? others : written} />
        )}
      </section>
    </AppShell>
  )
}
