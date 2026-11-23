import { useObjectUrl } from '../hooks/useObjectUrl'
import type { Prompt } from '../types'

/** Small square preview of a prompt for list rows. */
export function PromptThumb({ prompt }: { prompt: Prompt | undefined }) {
  const url = useObjectUrl(prompt?.image)
  if (url) return <img src={url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
  return (
    <div aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-bg text-2xl">
      💬
    </div>
  )
}
