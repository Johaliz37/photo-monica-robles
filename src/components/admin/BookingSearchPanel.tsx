import { useId, useState } from 'react'
import { isSearchActive, type BookingSearch } from '@/lib/bookingSearch'

type Props = {
  value: BookingSearch
  onChange: (field: keyof BookingSearch, value: string) => void
  onClear: () => void
}

const INPUT =
  'mt-1 block min-h-11 w-full rounded-sm bg-white px-3 text-sm text-ink ring-1 ring-teal/30 placeholder:text-ink/40 focus:ring-2 focus:ring-teal focus:outline-none'

/** Panel para buscar reservas por código, nombre, día y hora. */
export default function BookingSearchPanel({ value, onChange, onClear }: Props) {
  const id = useId()
  const active = isSearchActive(value)
  const activeCount = Object.values(value).filter((v) => v.trim() !== '').length
  // Plegado por defecto; abierto si ya llega con una búsqueda (p. ej. al volver del detalle)
  const [open, setOpen] = useState(active)

  return (
    <div
      role="search"
      aria-label="Buscar reservas"
      className={`mb-6 block rounded-sm border-t-4 bg-white/80 shadow-sm ring-1 ${
        active ? 'border-leaf ring-leaf/60' : 'border-teal ring-gold-light/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3 pr-4 sm:pr-5">
        <h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-fields`}
            onClick={() => setOpen(!open)}
            className="flex min-h-12 items-center gap-2 py-2 pl-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal sm:pl-5"
          >
            <span aria-hidden="true" className="text-base">
              🔍
            </span>
            Buscar reservas
            {!open && activeCount > 0 && (
              <span className="rounded-full bg-leaf px-2 py-0.5 text-[0.7rem] tracking-normal text-teal normal-case">
                {activeCount === 1 ? '1 filtro' : `${activeCount} filtros`}
              </span>
            )}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </h2>
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-9 rounded-full bg-xmas-red/10 px-3 text-xs font-semibold text-xmas-red ring-1 ring-xmas-red/30 transition hover:bg-xmas-red/20"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {open && (
        <div
          id={`${id}-fields`}
          className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5 lg:grid-cols-4"
        >
          <label htmlFor={`${id}-code`} className="text-xs font-semibold text-ink/70">
            Código de reserva
            <input
              id={`${id}-code`}
              type="search"
              value={value.code}
              onChange={(e) => onChange('code', e.target.value)}
              placeholder="Ej. 3F2A9C1B"
              autoComplete="off"
              spellCheck={false}
              className={`${INPUT} font-mono uppercase placeholder:normal-case`}
            />
          </label>
          <label htmlFor={`${id}-name`} className="text-xs font-semibold text-ink/70">
            Nombre del cliente
            <input
              id={`${id}-name`}
              type="search"
              value={value.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Ej. Ana"
              autoComplete="off"
              className={INPUT}
            />
          </label>
          <label htmlFor={`${id}-date`} className="text-xs font-semibold text-ink/70">
            Fecha de la sesión
            <input
              id={`${id}-date`}
              type="date"
              value={value.date}
              onChange={(e) => onChange('date', e.target.value)}
              className={INPUT}
            />
          </label>
          <label htmlFor={`${id}-time`} className="text-xs font-semibold text-ink/70">
            Hora (sesión en curso)
            <input
              id={`${id}-time`}
              type="time"
              step={300}
              value={value.time}
              onChange={(e) => onChange('time', e.target.value)}
              className={INPUT}
            />
          </label>
        </div>
      )}
    </div>
  )
}
