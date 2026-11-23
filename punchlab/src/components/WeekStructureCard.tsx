import { STRUCTURE_GUIDE } from '../content/structureGuide'
import { isoWeek, structureOfWeek } from '../lib/week'

/** Highlighted structure for the current ISO week, with a short how-to and one example. */
export function WeekStructureCard({ today }: { today: Date }) {
  const structure = structureOfWeek(today)
  const { week } = isoWeek(today)
  const guide = STRUCTURE_GUIDE[structure]
  return (
    <section aria-labelledby="week-structure" className="rounded-2xl border border-accent/40 bg-surface p-4">
      <p className="text-sm text-muted">Structure of the week · W{week}</p>
      <h2 id="week-structure" className="mt-1 text-xl font-bold text-accent">
        {structure}
      </h2>
      <p className="mt-2">{guide.explanation[0]}</p>
      <p className="text-muted">{guide.explanation[1]}</p>
      {guide.example && (
        <blockquote className="mt-3 border-l-2 border-accent pl-3 italic">{guide.example}</blockquote>
      )}
    </section>
  )
}
