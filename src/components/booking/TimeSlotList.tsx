import { formatTime } from '@/lib/dates'

type Props = {
  slots: Date[]
  durationMin: number
  selected: string | null
  onSelect: (startsAt: string) => void
}

export default function TimeSlotList({ slots, durationMin, selected, onSelect }: Props) {
  if (slots.length === 0) {
    return <p className="text-sm">Ya no quedan horas libres este día. Elige otro día.</p>
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((slot) => {
        const iso = slot.toISOString()
        const end = new Date(slot.getTime() + durationMin * 60_000)
        const isSelected = iso === selected
        return (
          <li key={iso}>
            <button
              type="button"
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              className={`min-h-11 w-full rounded-full px-3 py-2 text-sm tabular-nums ring-1 transition ${
                isSelected
                  ? 'bg-gold-dark font-semibold text-cream ring-gold-dark'
                  : 'bg-white/60 ring-gold-light hover:bg-cream-dark'
              }`}
            >
              {formatTime(slot)} – {formatTime(end)}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
