import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BigButton } from '../components/BigButton'
import { ActiveLine, LockedLine } from '../components/DrillSlot'
import { PromptView } from '../components/PromptView'
import { repo } from '../db/repo'
import { useConfirmTap } from '../hooks/useConfirmTap'
import { useNow } from '../hooks/useNow'
import { elapsedMs, formatClock, isExpired, remainingMs } from '../lib/timer'
import type { DrillLine, Session } from '../types'

export function DrillScreen() {
  const id = Number(useParams().id)
  const session = useLiveQuery(() => repo.getSession(id), [id], null)

  if (session === null) return null
  if (!session) return <Navigate to="/" replace />
  if (session.status !== 'drilling') return <Navigate to={`/sessions/${id}`} replace />
  return <Drill key={id} session={session} />
}

function newLine(slot: number, text: string): DrillLine {
  return { slot, structure: '', text }
}

function Drill({ session }: { session: Session }) {
  const navigate = useNavigate()
  const sessionId = session.id!
  const prompt = useLiveQuery(() => repo.getPrompt(session.promptId), [session.promptId])
  const [lines, setLines] = useState<DrillLine[]>(session.lines)
  const [draft, setDraft] = useState('')
  const finishing = useRef(false)
  const confirmFinish = useConfirmTap()

  const now = useNow(250)
  const unlimited = session.endsAt === null
  // Timed drills count down; unlimited drills count up.
  const clock = session.endsAt === null ? elapsedMs(session.startedAt, now) : remainingMs(session.endsAt, now)
  const lowTime = !unlimited && clock <= 30_000
  const activeSlot = lines.length
  const written = lines.filter((l) => l.text).length

  const finish = useCallback(async () => {
    if (finishing.current) return
    finishing.current = true
    // Keep whatever was being typed when time ran out.
    const text = draft.trim()
    const final = text ? [...lines, newLine(lines.length, text)] : lines
    await repo.finishDrill(sessionId, final)
    navigate(`/sessions/${sessionId}`, { replace: true, state: { drillSaved: true } })
  }, [lines, draft, sessionId, navigate])

  useEffect(() => {
    if (isExpired(session.endsAt, now)) void finish()
  }, [now, session.endsAt, finish])

  async function lockAndNext() {
    const next = [...lines, newLine(activeSlot, draft.trim())]
    setLines(next)
    setDraft('')
    await repo.lockLines(sessionId, next)
  }

  const active = newLine(activeSlot, draft)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-muted">
            Line {activeSlot + 1} · {written} written
          </span>
          <span
            role="timer"
            aria-label={unlimited ? `No time limit, ${formatClock(clock)} so far` : `Time left ${formatClock(clock)}`}
            className={`flex items-baseline gap-2 text-3xl font-bold tabular-nums ${lowTime ? 'text-red-400' : 'text-ink'}`}
          >
            {unlimited && <span className="text-sm font-normal text-muted">∞</span>}
            {formatClock(clock)}
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
          <LockedLine key={line.slot} line={line} />
        ))}
        <ActiveLine line={active} draft={draft} onDraftChange={setDraft} />
      </ol>

      <footer className="sticky bottom-0 flex gap-2 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <BigButton
          variant="ghost"
          className={`!w-auto shrink-0 ${confirmFinish.armed ? '!border-accent text-accent' : ''}`}
          onClick={() => confirmFinish.tap(() => void finish())}
          aria-live="polite"
        >
          {confirmFinish.armed ? 'Tap to finish' : 'Finish'}
        </BigButton>
        <BigButton onClick={lockAndNext}>{draft.trim() ? 'Lock & next' : 'Skip'}</BigButton>
      </footer>
    </div>
  )
}
