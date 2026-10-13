import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { findPackage } from '@/content/packages'
import type { TimeRange } from '@/lib/admin'
import type { Booking } from '@/lib/adminApi'
import {
  dayAvailability,
  repeatLabel,
  ruleDays,
  type Rule,
  type RuleInput,
} from '@/lib/availability'
import { calendarDate } from '@/lib/calendar'
import { formatTime } from '@/lib/dates'
import RangeForm, { type Draft } from './RangeForm'
import RangeTimeline from './RangeTimeline'
import { ruleChipClass } from './ruleStyle'

type Props = {
  day: string
  today: string
  lastDay: string
  minMin: number
  /** Rangos que se aplican este día. */
  dayRules: Rule[]
  dayBookings: Booking[]
  /** Todos los rangos y reservas activas, para la vista previa de los cambios. */
  rules: Rule[]
  bookings: Booking[]
  focusRuleId: string | null
  draft: Draft | null
  notice: string | null
  onSelectRange: (range: TimeRange) => void
  onNew: () => void
  onEdit: (rule: Rule) => void
  onDelete: (rule: Rule) => void
  onDraftChange: (rule: RuleInput) => void
  onCancelDraft: () => void
  onSaved: (message: string) => void
}

const BUTTON_SMALL = 'min-h-9 rounded-full px-3 text-xs font-semibold ring-1'

/** Día seleccionado: rejilla para elegir un rango, formulario y rangos y reservas del día. */
export default function DayPanel({
  day,
  today,
  lastDay,
  minMin,
  dayRules,
  dayBookings,
  rules,
  bookings,
  focusRuleId,
  draft,
  notice,
  onSelectRange,
  onNew,
  onEdit,
  onDelete,
  onDraftChange,
  onCancelDraft,
  onSaved,
}: Props) {
  const readOnly = day < today || day > lastDay

  return (
    <section aria-labelledby="day-panel-title" className="space-y-4">
      <div>
        <h2
          id="day-panel-title"
          className="font-display text-lg tracking-[0.1em] text-gold-dark first-letter:uppercase"
        >
          {format(calendarDate(day), "EEEE, d 'de' MMMM", { locale: es })}
        </h2>
        <p className="text-sm">
          {readOnly
            ? day < today
              ? 'Día pasado: solo consulta.'
              : 'Fuera de la temporada: solo consulta.'
            : 'Arrastra sobre las horas para seleccionar un rango, o toca la hora de inicio y luego la de fin.'}
        </p>
      </div>

      {notice && (
        <p role="status" className="rounded-sm bg-pine/10 p-3 text-sm text-pine">
          {notice}
        </p>
      )}

      <div data-tour="timeline">
        <RangeTimeline
          key={day}
          blocked={dayRules.filter((r) => r.kind === 'no_disponible')}
          available={dayAvailability(dayRules, minMin)}
          bookings={dayBookings}
          selection={draft?.rule ?? null}
          readOnly={readOnly}
          onSelect={onSelectRange}
        />
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-teal/15 ring-1 ring-teal/40" />
          Disponible (se puede reservar)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 rounded-sm bg-xmas-red/20 ring-1 ring-xmas-red/50"
          />
          No disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-honey" />
          Reserva (⏳ pendiente)
        </span>
      </p>

      {draft && (
        <RangeForm
          // Un formulario nuevo (sin estado de confirmación ni errores) por cada rango
          key={draft.id ?? `new-${day}`}
          draft={draft}
          original={draft.id ? rules.find((r) => r.id === draft.id) : undefined}
          rules={rules}
          bookings={bookings}
          today={today}
          lastDay={lastDay}
          minMin={minMin}
          onChange={onDraftChange}
          onCancel={onCancelDraft}
          onSaved={onSaved}
        />
      )}
      {!draft && !readOnly && (
        <button
          type="button"
          data-tour="add-range"
          onClick={onNew}
          className="min-h-11 rounded-full px-4 text-sm font-semibold text-teal ring-1 ring-teal/40 hover:bg-teal/10"
        >
          + Añadir rango
        </button>
      )}

      <div data-tour="day-rules">
        <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-ink/70">Rangos de este día</h3>
        {dayRules.length === 0 ? (
          <p className="text-sm text-ink/70">No hay rangos configurados.</p>
        ) : (
          <ul className="space-y-2">
            {dayRules.map((r) => {
              // Una serie que solo tiene días pasados ya no se puede cambiar
              const editable = ruleDays(r).some((d) => d >= today)
              return (
                <li
                  key={r.id}
                  className={`rounded-sm p-2 text-sm ring-1 ${ruleChipClass(r)} ${
                    r.id === focusRuleId || r.id === draft?.id ? 'ring-2' : ''
                  }`}
                >
                  <p className="font-semibold tabular-nums">
                    {r.kind === 'disponible' ? 'Disponible' : 'No disponible'} · {r.start}–{r.end}
                  </p>
                  <p className="text-xs">
                    {r.repeat !== 'unico' && '↻ '}
                    {repeatLabel(r)}
                  </p>
                  {editable && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        className={`${BUTTON_SMALL} bg-white/70 text-ink ring-gold-light hover:bg-cream-dark`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r)}
                        className={`${BUTTON_SMALL} bg-white/70 text-xmas-red ring-xmas-red/40 hover:bg-xmas-red/10`}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {dayBookings.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-ink/70">
            Reservas de este día
          </h3>
          <ul className="space-y-1 text-sm">
            {dayBookings.map((b) => (
              <li key={b.id}>
                <Link to={`/admin/reservas/${b.id}`} className="underline-offset-2 hover:underline">
                  <span className="tabular-nums">
                    {formatTime(b.starts_at)}–{formatTime(b.ends_at)}
                  </span>{' '}
                  · {b.client_name} · {findPackage(b.package_code)?.name ?? b.package_code}
                  {b.status === 'pendiente' && ' · ⏳ pendiente'}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
