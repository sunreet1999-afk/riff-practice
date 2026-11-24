import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PromptThumb } from '../components/PromptThumb'
import { repo } from '../db/repo'
import { countJokes, jokesLabel } from '../lib/drillStats'
import { average, formatDay } from '../lib/format'
import type { SessionWithPrompt } from '../types'

function SessionRow({ item }: { item: SessionWithPrompt }) {
  const { session, prompt } = item
  const jokes = countJokes(session).total
  const avg = average(session.picks.map((p) => p.rating))
  const title = prompt?.text || (prompt?.kind === 'image' ? 'Photo prompt' : 'Prompt')
  return (
    <li>
      <Link to={`/sessions/${session.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl bg-surface p-3 active:bg-line">
        <PromptThumb prompt={prompt} />
        <div className="min-w-0 flex-1">
          <p className="truncate">{title}</p>
          <p className="text-sm text-muted">
            {formatDay(session.startedAt)} · {jokesLabel(jokes)} ·{' '}
            {session.status === 'done' ? (avg !== null ? `★ ${avg}` : 'Judged') : 'Not judged'}
          </p>
        </div>
      </Link>
    </li>
  )
}

export function SessionsScreen() {
  const items = useLiveQuery(() => repo.listCompletedSessions(), [])

  return (
    <AppShell title="Sessions" nav>
      {items && items.length === 0 && (
        <p className="rounded-2xl bg-surface p-4 text-muted">No sessions yet. Finish a 5-minute drill and it shows up here.</p>
      )}
      <ul className="flex flex-col gap-2">
        {items?.map((item) => (
          <SessionRow key={item.session.id} item={item} />
        ))}
      </ul>
    </AppShell>
  )
}
