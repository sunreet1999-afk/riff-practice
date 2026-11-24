import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BigButton } from '../components/BigButton'
import { ActiveLine, LockedLine } from '../components/DrillSlot'
import { PromptView } from '../components/PromptView'
import { TimeUpSheet } from '../components/TimeUpSheet'
import { repo } from '../db/repo'
import { useConfirmTap } from '../hooks/useConfirmTap'
import { useNow } from '../hooks/useNow'
import { countJokes, plannedEnd, wasExtended, type Extension } from '../lib/drillStats'
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

function newLine(slot: number, text: string, at?: number): DrillLine {
  return { slot, structure: '', text, at }
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
  const [busy, setBusy] = useState(false)
  const unlimited = session.endsAt === null
  const timeUp = isExpired(session.endsAt, now)
  // Timed drills count down; unlimited drills count up.
  const clock = session.endsAt === null ? elapsedMs(session.startedAt, now) : remainingMs(session.endsAt, now)
  const lowTime = !unlimited && clock <= 30_000
  const activeSlot = lines.length
  const jokes = countJokes({ ...session, lines })
  const sinceStart = () => Date.now() - session.startedAt

  /**
   * Locks the line being typed. Once time is up it is stamped at the moment the
   * timer ended, so it counts toward the planned time even if locked later.
   */
  function withDraft(): DrillLine[] {
    const text = draft.trim()
    if (!text) return lines
    const at = timeUp && session.endsAt !== null ? session.endsAt - session.startedAt : sinceStart()
    return [...lines, newLine(lines.length, text, at)]
  }

  const finish = useCallback(async (final: DrillLine[]) => {
    if (finishing.current) return
    finishing.current = true
    await repo.finishDrill(sessionId, final)
    navigate(`/sessions/${sessionId}`, { replace: true, state: { drillSaved: true } })
  }, [sessionId, navigate])

  async function extend(extension: Extension) {
    setBusy(true)
    const next = withDraft()
    setLines(next)
    setDraft('')
    await repo.extendDrill(sessionId, extension, next)
    setBusy(false)
  }

  async function lockAndNext() {
    const next = [...lines, newLine(activeSlot, draft.trim(), sinceStart())]
    setLines(next)
    setDraft('')
    await repo.lockLines(sessionId, next)
  }

  const firstEnd = plannedEnd(session)
  const plannedMin = firstEnd === null ? '' : `${Math.round((firstEnd - session.startedAt) / 60_000)} min`
  // After an extension the sheet shows the running total, e.g. "9 jokes in 5 min + extra time".
  const period = wasExtended(session) ? `${plannedMin} + extra time` : plannedMin
  const active = newLine(activeSlot, draft)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-accent tabular-nums">{jokes.total}</span>
            <span className="text-muted">
              joke{jokes.total === 1 ? '' : 's'}
              {jokes.extra > 0 && ` · ${jokes.extra} extra`}
            </span>
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
        {!timeUp && <ActiveLine line={active} draft={draft} onDraftChange={setDraft} />}
      </ol>

      <footer className="sticky bottom-0 flex gap-2 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <BigButton
          variant="ghost"
          className={`!w-auto shrink-0 ${confirmFinish.armed ? '!border-accent text-accent' : ''}`}
          onClick={() => confirmFinish.tap(() => void finish(withDraft()))}
          aria-live="polite"
        >
          {confirmFinish.armed ? 'Tap to finish' : 'Finish'}
        </BigButton>
        <BigButton onClick={lockAndNext}>{draft.trim() ? 'Lock & next' : 'Skip'}</BigButton>
      </footer>

      {timeUp && (
        <TimeUpSheet
          jokes={jokes.total}
          period={period}
          onExtend={(ext) => void extend(ext)}
          onFinish={() => void finish(withDraft())}
          busy={busy}
        />
      )}
    </div>
  )
}
