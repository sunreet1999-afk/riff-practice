import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BigButton } from '../components/BigButton'
import { DrillSlot, type SlotState } from '../components/DrillSlot'
import { PromptView } from '../components/PromptView'
import { repo } from '../db/repo'
import { useNow } from '../hooks/useNow'
import { SLOT_COUNT } from '../lib/structures'
import { formatClock, isExpired, remainingMs } from '../lib/timer'
import type { DrillLine, Session } from '../types'

function slotState(slot: number, active: number): SlotState {
  if (slot < active) return 'locked'
  if (slot === active) return 'active'
  return 'upcoming'
}

export function DrillScreen() {
  const id = Number(useParams().id)
  const session = useLiveQuery(() => repo.getSession(id), [id], null)

  if (session === null) return null
  if (!session) return <Navigate to="/" replace />
  if (session.status !== 'drilling') return <Navigate to={`/judge/${id}`} replace />
  return <Drill key={id} session={session} />
}

function Drill({ session }: { session: Session }) {
  const navigate = useNavigate()
  const sessionId = session.id!
  const prompt = useLiveQuery(() => repo.getPrompt(session.promptId), [session.promptId])
  const [lines, setLines] = useState<DrillLine[]>(session.lines)
  const [active, setActive] = useState(session.activeSlot)
  const [draft, setDraft] = useState('')
  const finishing = useRef(false)

  const now = useNow(250)
  const left = remainingMs(session.endsAt, now)
  const lowTime = left <= 30_000

  const finish = useCallback(async () => {
    if (finishing.current) return
    finishing.current = true
    // Keep whatever was being typed when time ran out.
    const final = lines.map((l) => (l.slot === active ? { ...l, text: draft.trim() } : l))
    await repo.finishDrill(sessionId, final)
    navigate(`/judge/${sessionId}`, { replace: true })
  }, [lines, active, draft, sessionId, navigate])

  useEffect(() => {
    if (isExpired(session.endsAt, now)) void finish()
  }, [now, session.endsAt, finish])

  async function lockAndNext() {
    if (active >= SLOT_COUNT) return
    const next = lines.map((l) => (l.slot === active ? { ...l, text: draft.trim() } : l))
    setLines(next)
    setDraft('')
    setActive(active + 1)
    await repo.lockLines(sessionId, next, active + 1)
  }

  function finishEarly() {
    const done = active >= SLOT_COUNT
    if (done || window.confirm('Finish now and go to Judge?')) void finish()
  }

  const allLocked = active >= SLOT_COUNT

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-muted">
            Line {Math.min(active + 1, SLOT_COUNT)}/{SLOT_COUNT}
          </span>
          <span
            role="timer"
            aria-label={`Time left ${formatClock(left)}`}
            className={`text-3xl font-bold tabular-nums ${lowTime ? 'text-red-400' : 'text-ink'}`}
          >
            {formatClock(left)}
          </span>
        </div>
        {prompt && (
          <div className="mt-2">
            <PromptView prompt={prompt} compact />
          </div>
        )}
      </header>

      <ol className="flex flex-1 flex-col gap-3 px-4 py-4">
        {lines.map((line) => (
          <DrillSlot
            key={line.slot}
            line={line}
            state={slotState(line.slot, active)}
            draft={draft}
            onDraftChange={setDraft}
          />
        ))}
      </ol>

      <footer className="sticky bottom-0 flex gap-2 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <BigButton variant="ghost" className="!w-auto shrink-0" onClick={finishEarly}>
          Finish
        </BigButton>
        <BigButton onClick={lockAndNext} disabled={allLocked}>
          {allLocked ? 'All lines locked' : draft.trim() ? 'Lock & next' : 'Skip'}
        </BigButton>
      </footer>
    </div>
  )
}
