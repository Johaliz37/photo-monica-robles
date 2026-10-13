import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useMemo, useRef, useState } from 'react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/booking/Stepper'
import { timeOptions } from '@/lib/admin'
import { saveAvailabilityRule, type Booking } from '@/lib/adminApi'
import {
  formatDays,
  previewChange,
  repeatLabel,
  type Rule,
  type RuleInput,
  type RuleRepeat,
} from '@/lib/availability'
import { calendarDate } from '@/lib/calendar'
import { errorMessage } from '@/lib/errors'
import BookingConflicts from './BookingConflicts'
import { FROM_HOUR, TO_HOUR } from './RangeTimeline'

/** Rango que se está creando (id null) o editando. */
export interface Draft {
  id: string | null
  rule: RuleInput
}

type Props = {
  draft: Draft
  /** Rango guardado que se edita (para avisar de lo que cambia). */
  original: Rule | undefined
  rules: Rule[]
  bookings: Booking[]
  today: string
  /** Último día que se puede elegir en "Hasta". */
  lastDay: string
  minMin: number
  onChange: (rule: RuleInput) => void
  onCancel: () => void
  onSaved: (message: string) => void
}

const TIMES = timeOptions(FROM_HOUR, TO_HOUR)
const SELECT_CLASS = 'mt-1 block min-h-11 w-full rounded-sm bg-white/70 px-3 ring-1 ring-gold-light'
const longDay = (day: string) => format(calendarDate(day), "EEEE d 'de' MMMM", { locale: es })

function sameRule(a: RuleInput, b: RuleInput): boolean {
  return (
    a.kind === b.kind &&
    a.day === b.day &&
    a.start === b.start &&
    a.end === b.end &&
    a.repeat === b.repeat &&
    (a.repeat !== 'hasta' || a.until === b.until)
  )
}

/** Configuración de un rango: horas, tipo y repetición, con vista previa y avisos. */
export default function RangeForm({
  draft,
  original,
  rules,
  bookings,
  today,
  lastDay,
  minMin,
  onChange,
  onCancel,
  onSaved,
}: Props) {
  const rule = draft.rule
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLFormElement>(null)

  // Al abrirse queda debajo de la rejilla: se acerca a la vista
  useEffect(() => {
    ref.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const preview = useMemo(
    () => previewChange(rules, { id: draft.id, rule }, bookings, today, minMin),
    [rules, draft.id, rule, bookings, today, minMin],
  )

  const timeError =
    rule.end <= rule.start ? 'La hora de fin debe ser posterior a la de inicio.' : null
  const untilError =
    rule.repeat === 'hasta' && (!rule.until || rule.until < rule.day || rule.until > lastDay)
      ? `Elige una fecha entre el ${longDay(rule.day)} y el ${longDay(lastDay)}.`
      : null
  // Al editar una serie, lo que desaparece o cambia de tipo necesita confirmación
  const wasSeries = original !== undefined && original.repeat !== 'unico'
  const kindChanged = original !== undefined && original.kind !== rule.kind
  const needsConfirm = wasSeries && (preview.removedDays.length > 0 || kindChanged)
  const unchanged = original !== undefined && sameRule(original, rule)
  const canSave =
    !busy &&
    !timeError &&
    !untilError &&
    !unchanged &&
    preview.days.length > 0 &&
    preview.conflicts.length === 0

  function patch(changes: Partial<RuleInput>) {
    setError(null)
    onChange({ ...rule, ...changes })
  }

  function setRepeat(repeat: RuleRepeat) {
    patch({ repeat, until: repeat === 'hasta' ? (rule.until ?? lastDay) : rule.until })
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await saveAvailabilityRule(draft.id, {
        ...rule,
        until: rule.repeat === 'hasta' ? rule.until : null,
      })
      setConfirming(false)
      onSaved(draft.id ? 'Rango actualizado.' : 'Rango creado.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    if (needsConfirm) setConfirming(true)
    else void save()
  }

  const removedWarning = wasSeries && preview.removedDays.length > 0 && (
    <p>
      La serie dejará de aplicarse a{' '}
      {preview.removedDays.length === 1 ? 'este día' : `estos ${preview.removedDays.length} días`}:{' '}
      <strong>{formatDays(preview.removedDays)}</strong>.
    </p>
  )
  const kindWarning = wasSeries && kindChanged && (
    <p>
      Todos los días de la serie pasarán a ser{' '}
      <strong>{rule.kind === 'disponible' ? 'disponibles' : 'no disponibles'}</strong>.
    </p>
  )

  return (
    <form
      ref={ref}
      onSubmit={submit}
      className="space-y-4 rounded-sm bg-white/70 p-4 ring-1 ring-gold-light"
    >
      <div>
        <h3 className="font-display tracking-[0.1em] text-gold-dark">
          {draft.id ? 'Editar rango' : 'Nuevo rango'}
        </h3>
        <p className="text-sm first-letter:uppercase">
          {longDay(rule.day)}
          {draft.id && rule.repeat !== 'unico' && ' (día de inicio de la serie)'}
        </p>
      </div>

      {/* 1. Horas */}
      <fieldset>
        <legend className="text-sm font-semibold">Horario</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Desde
            <select
              value={rule.start}
              onChange={(e) => patch({ start: e.target.value })}
              className={SELECT_CLASS}
            >
              {TIMES.slice(0, -1).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Hasta
            <select
              value={rule.end}
              onChange={(e) => patch({ end: e.target.value })}
              className={SELECT_CLASS}
            >
              {TIMES.slice(1).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        {timeError && <p className="mt-1 text-sm text-xmas-red">{timeError}</p>}
      </fieldset>

      {/* 2. Tipo */}
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Tipo de rango</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              [
                'disponible',
                'Disponible',
                'has-checked:bg-teal has-checked:text-cream has-checked:ring-teal',
              ],
              [
                'no_disponible',
                'No disponible',
                'has-checked:bg-xmas-red has-checked:text-cream has-checked:ring-xmas-red',
              ],
            ] as const
          ).map(([value, label, checkedClass]) => (
            <label
              key={value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-semibold ring-1 ring-gold-light has-focus-visible:outline-2 ${checkedClass}`}
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={rule.kind === value}
                onChange={() => patch({ kind: value })}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 3. Repetición */}
      <fieldset className="space-y-2 text-sm">
        <legend className="mb-1 font-semibold">Repetición</legend>
        <label className="flex min-h-9 items-center gap-2">
          <input
            type="radio"
            name="repeat"
            checked={rule.repeat === 'unico'}
            onChange={() => setRepeat('unico')}
          />
          Único (solo este día)
        </label>
        <label className="flex min-h-9 items-center gap-2">
          <input
            type="radio"
            name="repeat"
            checked={rule.repeat !== 'unico'}
            onChange={() => setRepeat('mes')}
          />
          En serie
        </label>
        {rule.repeat !== 'unico' && (
          <div className="ml-6 space-y-2 border-l-2 border-gold-light pl-3">
            <label className="flex min-h-9 items-center gap-2">
              <input
                type="radio"
                name="series"
                checked={rule.repeat === 'mes'}
                onChange={() => setRepeat('mes')}
              />
              Mes actual ({repeatLabel({ ...rule, repeat: 'mes' }).toLowerCase()})
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex min-h-9 items-center gap-2">
                <input
                  type="radio"
                  name="series"
                  checked={rule.repeat === 'hasta'}
                  onChange={() => setRepeat('hasta')}
                />
                Hasta:
              </label>
              <input
                type="date"
                aria-label="Hasta la fecha"
                value={rule.until ?? ''}
                min={rule.day}
                max={lastDay}
                onFocus={() => rule.repeat !== 'hasta' && setRepeat('hasta')}
                onChange={(e) => patch({ repeat: 'hasta', until: e.target.value || null })}
                className="min-h-11 rounded-sm bg-white/70 px-3 ring-1 ring-gold-light"
              />
            </div>
            {untilError && <p className="text-xmas-red">{untilError}</p>}
          </div>
        )}
      </fieldset>

      {/* Vista previa y avisos */}
      {!timeError && !untilError && (
        <div aria-live="polite" className="space-y-2 text-sm">
          {preview.days.length === 0 ? (
            <p className="text-xmas-red">Este rango no se aplica a ningún día a partir de hoy.</p>
          ) : (
            <p>
              <strong>{repeatLabel(rule)}</strong>, de {rule.start} a {rule.end},{' '}
              {rule.kind === 'disponible' ? 'disponible' : 'no disponible'}.{' '}
              {preview.days.length === 1
                ? `Se aplica al ${formatDays(preview.days)}.`
                : `Se aplica a ${preview.days.length} días: ${formatDays(preview.days)}.`}
            </p>
          )}
          {(removedWarning || kindWarning) && (
            <div className="rounded-sm bg-honey/15 p-3 text-honey-dark ring-1 ring-honey/50">
              <p className="font-semibold">⚠ Atención: se modificarán otros rangos de la serie.</p>
              {removedWarning}
              {kindWarning}
              <p>Te pediremos confirmación al guardar.</p>
            </div>
          )}
          <BookingConflicts bookings={preview.conflicts} action="guardar este rango" />
          {unchanged && <p className="text-ink/70">No has cambiado nada.</p>}
        </div>
      )}

      {error && !confirming && (
        <p role="alert" className="rounded-sm bg-xmas-red/10 p-3 text-sm text-xmas-red">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={busy} className={BUTTON_SECONDARY}>
          Cancelar
        </button>
        <button type="submit" disabled={!canSave} className={BUTTON_PRIMARY}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="¿Modificar la serie?"
        confirmLabel="Sí, guardar"
        tone="danger"
        busy={busy}
        error={error}
        onConfirm={() => void save()}
        onCancel={() => setConfirming(false)}
      >
        {removedWarning}
        {kindWarning}
        <p>Los días anteriores a hoy no cambian. ¿Quieres continuar?</p>
      </ConfirmDialog>
    </form>
  )
}
