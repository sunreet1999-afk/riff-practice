import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BigButton } from '../components/BigButton'
import { DurationPicker } from '../components/DurationPicker'
import { PromptView } from '../components/PromptView'
import { WeekStructureCard } from '../components/WeekStructureCard'
import { repo } from '../db/repo'
import type { DrillLength } from '../lib/timer'

export function HomeScreen() {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const [today] = useState(() => new Date())

  const prompt = useLiveQuery(async () => (await repo.getPromptForDay()) ?? false, [], null)
  const streak = useLiveQuery(() => repo.getStreak(), [])
  const unfinished = useLiveQuery(() => repo.getUnfinishedSession(), [])
  const totals = useLiveQuery(() => repo.getJokeTotals(), [])
  const savedLength = useLiveQuery(() => repo.getDrillLength(), [])
  const [picked, setPicked] = useState<DrillLength>()
  const length = picked ?? savedLength ?? 5

  function chooseLength(l: DrillLength) {
    setPicked(l)
    void repo.setDrillLength(l)
  }

  async function startDrill() {
    if (!prompt || !prompt.id || starting) return
    setStarting(true)
    const id = await repo.startSession(prompt.id, new Date(), length)
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
        <div className="flex flex-col gap-2">
          <DurationPicker value={length} onChange={chooseLength} />
          <BigButton onClick={startDrill} disabled={!prompt || starting}>
            {length === 'unlimited' ? 'Start Drill · no limit' : `Start ${length}-min Drill`}
          </BigButton>
        </div>
      }
    >
      {unfinished && (
        <Link
          to={`/drill/${unfinished.id}`}
          className="flex min-h-14 items-center justify-between rounded-2xl border border-accent px-4 text-accent"
        >
          <span>Unfinished drill</span>
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

      {totals && totals.drills > 0 && (
        <section aria-label="Jokes written" className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface p-3">
            <p className="text-2xl font-bold text-accent tabular-nums">{totals.today}</p>
            <p className="text-sm text-muted">jokes today</p>
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="text-2xl font-bold tabular-nums">{totals.total}</p>
            <p className="text-sm text-muted">
              jokes in {totals.drills} drill{totals.drills === 1 ? '' : 's'}
            </p>
          </div>
        </section>
      )}

      <WeekStructureCard today={today} />

      <p className="px-1 text-sm text-muted">
        Write as many lines as you can before time runs out, or pick ∞ and finish when you're done. Lines lock as you go.
      </p>
    </AppShell>
  )
}
