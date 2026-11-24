import type { Idea } from '../lib/ideaPrompt'
import type { SearchHit } from '../lib/memeSearch'

interface IdeaCardProps {
  idea: Idea
  source: SearchHit | null
  onAnother: () => void
  onUse: () => void
}

/** One suggested prompt, with a link to the meme when it came from a search. */
export function IdeaCard({ idea, source, onAnother, onUse }: IdeaCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
      {idea.title && <p className="font-semibold text-accent">{idea.title}</p>}
      {idea.meme && (
        <p className="text-sm text-muted">
          <span className="font-semibold">Meme: </span>
          {idea.meme}
        </p>
      )}
      <p className="whitespace-pre-wrap break-words text-lg">{idea.situation}</p>
      {source && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-1 text-sm font-semibold text-accent underline underline-offset-4"
        >
          See the meme ↗{source.date && <span className="font-normal text-muted no-underline"> · {source.date}</span>}
        </a>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button type="button" onClick={onAnother} className="min-h-12 rounded-xl border border-line font-semibold active:bg-line">
          ↻ Another one
        </button>
        <button
          type="button"
          onClick={onUse}
          className="min-h-12 rounded-xl bg-accent font-semibold text-accent-ink active:brightness-90"
        >
          Use this
        </button>
      </div>
    </div>
  )
}
