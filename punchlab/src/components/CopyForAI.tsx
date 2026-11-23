import { useState } from 'react'
import { copyText } from '../lib/share'

/**
 * Copies a drill as plain text for ChatGPT, Claude or notes.
 * If the clipboard is blocked, shows the text so it can be selected by hand.
 */
export function CopyForAI({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    setState(await copyText(text))
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={copy}
        className="min-h-14 w-full rounded-2xl border border-line text-lg font-semibold active:bg-line"
      >
        {state === 'copied' ? '✓ Copied' : 'Copy for ChatGPT / Claude'}
      </button>
      {state === 'copied' && <p role="status" className="text-sm text-muted">Copied. Paste it into ChatGPT, Claude or your notes.</p>}
      {state === 'failed' && (
        <label className="flex flex-col gap-2">
          <span role="status" className="text-sm text-muted">
            Copy is blocked here. Select the text below and copy it.
          </span>
          <textarea
            readOnly
            value={text}
            rows={8}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-xl bg-bg p-3 text-sm"
          />
        </label>
      )}
    </div>
  )
}
