import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminContext } from '@/components/admin/AdminLayout'
import BookingCard from '@/components/admin/BookingCard'
import BookingTable from '@/components/admin/BookingTable'
import { BUTTON_SECONDARY } from '@/components/booking/Stepper'
import { Skeleton, SkeletonGroup } from '@/components/Skeleton'
import { fetchBookings, type Booking, type StatusFilter } from '@/lib/adminApi'
import { startOfMadridDay } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

const TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aceptada', label: 'Aceptadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'todas', label: 'Todas' },
]

function parseStatus(value: string | null): StatusFilter {
  return TABS.find((t) => t.value === value)?.value ?? 'pendiente'
}

export default function AdminBookings() {
  const { refreshPending } = useAdminContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('estado'))
  const showPast = searchParams.get('pasadas') === '1'
  const back = searchParams.toString() ? `?${searchParams.toString()}` : ''

  // Resultado ligado al filtro que lo pidió: al cambiar de pestaña se muestra "cargando"
  const queryKey = `${status}|${showPast}`
  const [result, setResult] = useState<{ key: string; bookings?: Booking[]; error?: string }>()
  const [reloads, setReloads] = useState(0)
  const reload = useCallback(() => setReloads((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    fetchBookings({ status, from: showPast ? null : startOfMadridDay(new Date()) })
      .then((bookings) => !cancelled && setResult({ key: queryKey, bookings }))
      .catch((err) => !cancelled && setResult({ key: queryKey, error: errorMessage(err) }))
    return () => {
      cancelled = true
    }
  }, [status, showPast, queryKey, reloads])

  // Recarga al volver a la pestaña del navegador
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  const current = result?.key === queryKey ? result : undefined
  const bookings = current?.bookings ?? null
  const error = current?.error ?? null

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value === null) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl tracking-[0.2em] text-gold-dark">Reservas</h1>
        <button
          type="button"
          onClick={() => {
            reload()
            refreshPending()
          }}
          className={BUTTON_SECONDARY}
        >
          Actualizar
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Estado" className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={tab.value === status}
              onClick={() => setParam('estado', tab.value === 'pendiente' ? null : tab.value)}
              className={`min-h-11 rounded-full px-4 text-sm ring-1 transition ${
                tab.value === status
                  ? 'bg-gold-dark font-semibold text-cream ring-gold-dark'
                  : 'bg-white/60 ring-gold-light hover:bg-cream-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setParam('pasadas', e.target.checked ? '1' : null)}
            className="size-4 accent-gold-dark"
          />
          Mostrar pasadas
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {error}
        </p>
      )}

      {bookings === null && !error && (
        <SkeletonGroup label="Cargando reservas…">
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 md:h-12" />
            ))}
          </div>
        </SkeletonGroup>
      )}

      {bookings?.length === 0 && (
        <p className="rounded-sm bg-white/50 p-6 text-center text-sm ring-1 ring-gold-light/50">
          No hay reservas.
        </p>
      )}

      {bookings && bookings.length > 0 && (
        <>
          <div className="hidden md:block">
            <BookingTable bookings={bookings} back={back} />
          </div>
          <ul className="space-y-3 md:hidden">
            {bookings.map((b) => (
              <li key={b.id}>
                <BookingCard booking={b} back={back} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
