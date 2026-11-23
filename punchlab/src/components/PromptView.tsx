import { useObjectUrl } from '../hooks/useObjectUrl'
import type { Prompt } from '../types'

interface PromptViewProps {
  prompt: Prompt
  compact?: boolean
}

/** Shows a text or image prompt. `compact` limits height for the drill header. */
export function PromptView({ prompt, compact = false }: PromptViewProps) {
  const url = useObjectUrl(prompt.image)
  return (
    <div className="flex flex-col gap-2">
      {url && (
        <img
          src={url}
          alt="Prompt"
          className={`w-full rounded-xl object-cover ${compact ? 'max-h-28' : 'max-h-72'}`}
        />
      )}
      {prompt.text && (
        <p className={`whitespace-pre-wrap break-words ${compact ? 'line-clamp-2 text-base' : 'text-lg'}`}>{prompt.text}</p>
      )}
    </div>
  )
}
