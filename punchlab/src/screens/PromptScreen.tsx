import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BackLink } from '../components/BackLink'
import { BigButton } from '../components/BigButton'
import { IdeaHelper } from '../components/IdeaHelper'
import { repo } from '../db/repo'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { prepareImage } from '../lib/image'
import type { PromptKind } from '../types'

const TABS: { kind: PromptKind; label: string }[] = [
  { kind: 'text', label: 'Situation' },
  { kind: 'image', label: 'Photo' },
]

/** `/prompt?note=ID` pre-fills the form from a journal note so it can be edited before saving. */
export function PromptScreen() {
  const noteParam = useSearchParams()[0].get('note')
  const noteId = noteParam ? Number(noteParam) : undefined
  const note = useLiveQuery(async () => (noteId ? ((await repo.getNote(noteId)) ?? false) : false), [noteId], null)
  if (note === null) return null
  return note ? <PromptForm key={note.id} initialText={note.text} noteId={note.id} /> : <PromptForm />
}

interface PromptFormProps {
  initialText?: string
  noteId?: number
}

function PromptForm({ initialText = '', noteId }: PromptFormProps) {
  const navigate = useNavigate()
  const [kind, setKind] = useState<PromptKind>('text')
  const [text, setText] = useState(initialText)
  const [image, setImage] = useState<Blob>()
  const [busy, setBusy] = useState(false)
  const previewUrl = useObjectUrl(image)

  const canSave = kind === 'text' ? text.trim().length > 0 : image !== undefined

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setImage(await prepareImage(file))
    setBusy(false)
  }

  async function save() {
    if (!canSave || busy) return
    setBusy(true)
    await repo.addPrompt({ kind, text: text.trim(), image: kind === 'image' ? image : undefined, noteId })
    navigate('/', { replace: true })
  }

  return (
    <AppShell
      title={noteId ? 'Prompt from note' : 'New prompt'}
      action={<BackLink />}
      footer={
        <BigButton onClick={save} disabled={!canSave || busy}>
          Save prompt
        </BigButton>
      }
    >
      <div role="tablist" className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.kind}
            type="button"
            role="tab"
            aria-selected={kind === t.kind}
            onClick={() => setKind(t.kind)}
            className={`min-h-12 rounded-xl font-semibold ${kind === t.kind ? 'bg-bg text-ink' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {kind === 'image' && (
        <div className="flex flex-col gap-3">
          {previewUrl && <img src={previewUrl} alt="Selected prompt" className="max-h-72 w-full rounded-xl object-cover" />}
          <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-line text-lg active:bg-surface">
            {image ? 'Choose a different photo' : 'Choose or take a photo'}
            <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
          </label>
          <p className="text-sm text-muted">The photo stays on this device.</p>
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-muted">{kind === 'text' ? 'What happened?' : 'Caption (optional)'}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={kind === 'text' ? 5 : 2}
          autoCapitalize="sentences"
          placeholder="e.g. Office lift mein sab ne ek saath phone nikaal liya"
          className="w-full resize-none rounded-2xl bg-surface p-4 text-lg outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent"
        />
      </label>

      {kind === 'text' && <IdeaHelper onUse={setText} />}
    </AppShell>
  )
}
