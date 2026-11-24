import { DRILL_LENGTHS, type DrillLength } from '../lib/timer'

interface DurationPickerProps {
  value: DrillLength
  onChange: (length: DrillLength) => void
}

function label(length: DrillLength): { big: string; small: string; aria: string } {
  return length === 'unlimited'
    ? { big: '∞', small: 'no limit', aria: 'No time limit' }
    : { big: String(length), small: 'min', aria: `${length} minutes` }
}

/** Drill length: 1, 2, 5, 10 minutes or no limit, as large tap targets. */
export function DurationPicker({ value, onChange }: DurationPickerProps) {
  return (
    <div role="radiogroup" aria-label="Drill length" className="grid grid-cols-5 gap-2">
      {DRILL_LENGTHS.map((length) => {
        const { big, small, aria } = label(length)
        const selected = value === length
        return (
          <button
            key={length}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={aria}
            onClick={() => onChange(length)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl leading-tight ${
              selected ? 'bg-accent text-accent-ink' : 'border border-line text-ink active:bg-surface'
            }`}
          >
            <span className="text-lg font-bold tabular-nums">{big}</span>
            <span className={`text-xs ${selected ? '' : 'text-muted'}`}>{small}</span>
          </button>
        )
      })}
    </div>
  )
}
