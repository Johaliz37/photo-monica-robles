import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useAdminContext } from '@/components/admin/AdminLayout'
import BookingCard from '@/components/admin/BookingCard'
import BookingSearchPanel from '@/components/admin/BookingSearchPanel'
import BookingTable from '@/components/admin/BookingTable'
import { Skeleton, SkeletonGroup } from '@/components/Skeleton'
import { fetchBookings, type Booking, type StatusFilter } from '@/lib/adminApi'
import {
  filterBookings,
  isSearchActive,
  type BookingSearch,
} from '@/lib/bookingSearch'
import { startOfMadridDay } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

// Cada pestaña con el color de su estado: sólido si está activa, tenue si no
const TABS: { value: StatusFilter; label: string; active: string; idle: string }[] = [
  {
    value: 'pendiente',
    label: 'Pendientes',
    active: 'bg-xmas-red text-cream ring-xmas-red',
    idle: 'bg-xmas-red/10 text-xmas-red ring-xmas-red/30 hover:bg-xmas-red/20',
  },
  {
    value: 'aceptada',
    label: 'Aceptadas',
    active: 'bg-pine text-cream ring-pine',
    idle: 'bg-pine/10 text-pine ring-pine/30 hover:bg-pine/20',
  },
  {
    value: 'rechazada',
    label: 'Rechazadas',
    active: 'bg-gold-dark text-cream ring-gold-dark',
    idle: 'bg-gold-light/20 text-gold-dark ring-gold-light/50 hover:bg-gold-light/30',
  },
  {
    value: 'todas',
    label: 'Todas',
    active: 'bg-teal text-cream ring-teal',
    idle: 'bg-teal/10 text-teal ring-teal/30 hover:bg-teal/20',
  },
]

// Nombre de cada criterio de búsqueda en la URL
const SEARCH_PARAMS: Record<keyof BookingSearch, string> = {
  code: 'codigo',
  name: 'nombre',
  date: 'fecha',
  time: 'hora',
}

function parseStatus(value: string | null): StatusFilter {
  return TABS.find((t) => t.value === value)?.value ?? 'pendiente'
}

export default function AdminBookings() {
  const { refreshPending } = useAdminContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('estado'))
  const showPast = searchParams.get('pasadas') === '1'
  // También se muestra en /admin cuando hoy no hay sesiones: se vuelve a donde se estaba
  const location = useLocation()
  const back = location.pathname + location.search

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
  const loaded = current?.bookings ?? null
  const error = current?.error ?? null

  // Búsqueda: se guarda en la URL (como la pestaña) y filtra la lista ya cargada
  const search: BookingSearch = {
    code: searchParams.get(SEARCH_PARAMS.code) ?? '',
    name: searchParams.get(SEARCH_PARAMS.name) ?? '',
    date: searchParams.get(SEARCH_PARAMS.date) ?? '',
    time: searchParams.get(SEARCH_PARAMS.time) ?? '',
  }
  const searching = isSearchActive(search)
  const bookings = loaded && filterBookings(loaded, search)
  // ¿La búsqueda ya abarca todas las reservas (todos los estados y también las pasadas)?
  const searchingEverything = status === 'todas' && showPast

  function setParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  function setParam(key: string, value: string | null) {
    setParams({ [key]: value })
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <header className="relative mb-6 overflow-hidden rounded-sm bg-teal p-5 text-cream shadow-md sm:p-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 -right-2 text-8xl opacity-15 select-none"
        >
          ❄
        </span>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-leaf">Navidad 2026</p>
            <h1 className="mt-1 font-display text-2xl tracking-[0.2em]">Reservas</h1>
            {bookings && loaded && (
              <p className="mt-2">
                <span className="rounded-full bg-leaf px-3 py-1 text-sm font-semibold text-teal">
                  {searching
                    ? `${bookings.length} de ${loaded.length} ${loaded.length === 1 ? 'reserva' : 'reservas'}`
                    : bookings.length === 1
                      ? '1 reserva'
                      : `${bookings.length} reservas`}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              reload()
              refreshPending()
            }}
            className="min-h-11 rounded-full bg-cream/10 px-4 text-sm ring-1 ring-cream/40 transition hover:bg-cream/20"
          >
            Actualizar
          </button>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Estado" className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={tab.value === status}
              onClick={() => setParam('estado', tab.value === 'pendiente' ? null : tab.value)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold ring-1 transition ${
                tab.value === status ? `${tab.active} shadow-md` : tab.idle
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-teal">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setParam('pasadas', e.target.checked ? '1' : null)}
            className="size-4 accent-teal"
          />
          Mostrar pasadas
        </label>
      </div>

      <BookingSearchPanel
        value={search}
        onChange={(field, value) => setParam(SEARCH_PARAMS[field], value)}
        onClear={() =>
          setParams(Object.fromEntries(Object.values(SEARCH_PARAMS).map((key) => [key, null])))
        }
      />

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
        <div className="flex flex-col items-center gap-3 rounded-sm bg-honey/20 p-6 text-center text-sm text-honey-dark ring-1 ring-honey/50">
          <p className="flex items-center gap-2">
            <span aria-hidden="true">{searching ? '🔍' : '🎁'}</span>
            {searching ? 'Ninguna reserva coincide con la búsqueda.' : 'No hay reservas.'}
          </p>
          {searching && !searchingEverything && (
            <button
              type="button"
              onClick={() => setParams({ estado: 'todas', pasadas: '1' })}
              className="min-h-11 rounded-full bg-teal px-4 text-sm font-semibold text-cream transition hover:bg-teal/90"
            >
              Buscar en todas las reservas, también las pasadas
            </button>
          )}
        </div>
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
