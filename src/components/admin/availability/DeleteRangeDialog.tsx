import { useState } from 'react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { deleteAvailabilityRule, type Booking } from '@/lib/adminApi'
import { formatDays, previewChange, repeatLabel, type Rule } from '@/lib/availability'
import { errorMessage } from '@/lib/errors'
import BookingConflicts from './BookingConflicts'

type Props = {
  rule: Rule | null
  rules: Rule[]
  bookings: Booking[]
  today: string
  minMin: number
  onCancel: () => void
  onDeleted: (message: string) => void
}

/** Confirmación para eliminar un rango. Si es una serie avisa de todos los días que se quitan. */
export default function DeleteRangeDialog({
  rule,
  rules,
  bookings,
  today,
  minMin,
  onCancel,
  onDeleted,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = rule
    ? previewChange(rules, { id: rule.id, rule: null }, bookings, today, minMin)
    : null
  const series = rule !== null && rule.repeat !== 'unico'

  async function confirm() {
    if (!rule) return
    setBusy(true)
    setError(null)
    try {
      await deleteAvailabilityRule(rule.id)
      onDeleted(series ? 'Serie eliminada.' : 'Rango eliminado.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConfirmDialog
      open={rule !== null}
      title={series ? '¿Eliminar la serie completa?' : '¿Eliminar el rango?'}
      confirmLabel={series ? 'Eliminar la serie' : 'Eliminar'}
      tone="danger"
      busy={busy}
      confirmDisabled={(preview?.conflicts.length ?? 0) > 0}
      error={error}
      onConfirm={() => void confirm()}
      onCancel={() => {
        setError(null)
        onCancel()
      }}
    >
      {rule && preview && (
        <>
          <p>
            <strong>{rule.kind === 'disponible' ? 'Disponible' : 'No disponible'}</strong> de{' '}
            {rule.start} a {rule.end} · {repeatLabel(rule)}
          </p>
          {series && preview.removedDays.length > 0 && (
            <div className="rounded-sm bg-honey/15 p-3 text-honey-dark ring-1 ring-honey/50">
              <p className="font-semibold">⚠ Es un rango en serie.</p>
              <p>
                Se eliminará en{' '}
                {preview.removedDays.length === 1
                  ? 'este día'
                  : `estos ${preview.removedDays.length} días`}
                : <strong>{formatDays(preview.removedDays)}</strong>. Los días anteriores a hoy no
                cambian.
              </p>
            </div>
          )}
          <BookingConflicts
            bookings={preview.conflicts}
            action={series ? 'eliminar la serie' : 'eliminar este rango'}
          />
        </>
      )}
    </ConfirmDialog>
  )
}
