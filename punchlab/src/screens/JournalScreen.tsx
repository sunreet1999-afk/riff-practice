import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BigButton } from '../components/BigButton'
import { repo } from '../db/repo'
import { useConfirmTap } from '../hooks/useConfirmTap'
import { formatDay, formatTime } from '../lib/format'
import type { Note } from '../types'

function NoteRow({ note }: { note: Note }) {
  const confirmDelete = useConfirmTap()
  function remove() {
    confirmDelete.tap(() => void repo.deleteNote(note.id!))
  }
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
      <p className="text-sm text-muted">
        {formatDay(note.createdAt)} · {formatTime(note.createdAt)}
        {note.usedAt && ' · used as prompt'}
      </p>
      <p className="whitespace-pre-wrap break-words text-lg">{note.text}</p>
      <div className="flex gap-2">
        <Link
          to={`/prompt?note=${note.id}`}
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-line font-semibold text-accent active:bg-line"
        >
          Use as prompt
        </Link>
        <button
          type="button"
          onClick={remove}
          aria-label={confirmDelete.armed ? 'Confirm delete note' : 'Delete note'}
          className={`min-h-12 rounded-xl border px-4 active:bg-line ${
            confirmDelete.armed ? 'border-red-400 text-red-400' : 'border-line text-muted'
          }`}
        >
          {confirmDelete.armed ? 'Sure?' : 'Delete'}
        </button>
      </div>
    </li>
  )
}

export function JournalScreen() {
  const notes = useLiveQuery(() => repo.listNotes(), [])
  const [text, setText] = useState('')

  async function add(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setText('')
    await repo.addNote(value)
  }

  return (
    <AppShell title="Journal" nav>
      <form onSubmit={add} className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <span className="text-muted">Odd or funny thing you noticed</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoCapitalize="sentences"
            placeholder="e.g. Chaiwale ne board pe likha: 'Gyaan free, chai ₹15'"
            className="w-full resize-none rounded-2xl bg-surface p-4 text-lg outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent"
          />
        </label>
        <BigButton type="submit" variant="ghost" disabled={!text.trim()}>
          Add note
        </BigButton>
      </form>

      {notes && notes.length === 0 && <p className="text-muted">No notes yet. Jot things down as you see them.</p>}
      <ul className="flex flex-col gap-2">
        {notes?.map((note) => (
          <NoteRow key={note.id} note={note} />
        ))}
      </ul>
    </AppShell>
  )
}
