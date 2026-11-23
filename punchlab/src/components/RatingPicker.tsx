interface RatingPickerProps {
  value: number | null
  onChange: (rating: number) => void
  label: string
}

const RATINGS = [1, 2, 3, 4, 5] as const

/** 1–5 self-rating as five large tap targets. */
export function RatingPicker({ value, onChange, label }: RatingPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex justify-between gap-2">
      {RATINGS.map((r) => {
        const selected = value === r
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(r)}
            className={`h-14 flex-1 rounded-xl text-lg font-semibold transition ${
              selected ? 'bg-accent text-accent-ink' : 'bg-bg text-ink border border-line active:bg-line'
            }`}
          >
            {r}
          </button>
        )
      })}
    </div>
  )
}
