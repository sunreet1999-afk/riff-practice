import { EXTENSIONS, jokesLabel, type Extension } from '../lib/drillStats'
import { BigButton } from './BigButton'

interface TimeUpSheetProps {
  jokes: number
  /** e.g. "5 min" */
  period: string
  onExtend: (extension: Extension) => void
  onFinish: () => void
  busy: boolean
}

/** Shown when a timed drill runs out: keep going for a bit, go unlimited, or finish. */
export function TimeUpSheet({ jokes, period, onExtend, onFinish, busy }: TimeUpSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeup-title"
        className="flex w-full max-w-md flex-col gap-3 rounded-t-3xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <h2 id="timeup-title" className="text-2xl font-bold">
          Time's up
        </h2>
        <p className="text-lg">
          <span className="font-bold text-accent tabular-nums">{jokesLabel(jokes)}</span> in {period}.
        </p>
        <p className="text-muted">Keep going? Jokes from extra time are counted separately.</p>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Add time">
          {EXTENSIONS.map((ext) => (
            <button
              key={ext}
              type="button"
              disabled={busy}
              onClick={() => onExtend(ext)}
              aria-label={ext === 'unlimited' ? 'Keep going with no limit' : `Add ${ext} minute${ext === 1 ? '' : 's'}`}
              className="flex min-h-14 flex-col items-center justify-center rounded-xl border border-line leading-tight active:bg-line disabled:opacity-40"
            >
              <span className="text-lg font-bold tabular-nums">{ext === 'unlimited' ? '∞' : `+${ext}`}</span>
              <span className="text-xs text-muted">{ext === 'unlimited' ? 'no limit' : 'min'}</span>
            </button>
          ))}
        </div>
        <BigButton onClick={onFinish} disabled={busy}>
          Finish & save
        </BigButton>
      </div>
    </div>
  )
}
