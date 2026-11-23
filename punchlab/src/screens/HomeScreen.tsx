import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BigButton } from '../components/BigButton'
import { PromptView } from '../components/PromptView'
import { Toast } from '../components/Toast'
import { repo } from '../db/repo'
import type { Session } from '../types'

interface HomeLocationState {
  saved?: boolean
}

function resumePath(session: Session): string {
  return session.status === 'drilling' ? `/drill/${session.id}` : `/judge/${session.id}`
}

export function HomeScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const saved = (location.state as HomeLocationState | null)?.saved === true
  const [starting, setStarting] = useState(false)

  const prompt = useLiveQuery(async () => (await repo.getPromptForDay()) ?? false, [], null)
  const streak = useLiveQuery(() => repo.getStreak(), [])
  const unfinished = useLiveQuery(() => repo.getUnfinishedSession(), [])

  async function startDrill() {
    if (!prompt || !prompt.id || starting) return
    setStarting(true)
    const id = await repo.startSession(prompt.id)
    navigate(`/drill/${id}`)
  }

  return (
    <AppShell
      title="PunchLab"
      nav
      action={
        <div className="rounded-xl bg-surface px-3 py-2 text-sm" aria-label={`Streak: ${streak ?? 0} days`}>
          🔥 <span className="font-semibold tabular-nums">{streak ?? 0}</span> day{streak === 1 ? '' : 's'}
        </div>
      }
      footer={
        <BigButton onClick={startDrill} disabled={!prompt || starting}>
          Start Drill
        </BigButton>
      }
    >
      {saved && <Toast message="Session saved." />}

      {unfinished && (
        <Link
          to={resumePath(unfinished)}
          className="flex min-h-14 items-center justify-between rounded-2xl border border-accent px-4 text-accent"
        >
          <span>{unfinished.status === 'drilling' ? 'Unfinished drill' : 'Judge step pending'}</span>
          <span className="font-semibold">Resume →</span>
        </Link>
      )}

      <section className="rounded-2xl bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-muted">Today's prompt</h2>
          {prompt && (
            <Link to="/prompt" className="flex min-h-12 items-center px-2 text-accent">
              Change
            </Link>
          )}
        </div>
        {prompt === null ? (
          <div className="h-24" aria-busy="true" />
        ) : prompt === false ? (
          <div className="flex flex-col gap-3">
            <p className="text-lg">No prompt yet today.</p>
            <p className="text-muted">Upload a photo or describe a situation you saw.</p>
            <Link
              to="/prompt"
              className="flex min-h-14 items-center justify-center rounded-2xl border border-line text-lg font-semibold active:bg-bg"
            >
              Add today's prompt
            </Link>
          </div>
        ) : (
          <PromptView prompt={prompt} />
        )}
      </section>

      <p className="px-1 text-sm text-muted">
        5 minutes · 10 lines · one structure per line. No editing, no ratings until time's up.
      </p>
    </AppShell>
  )
}
