import { Suspense, useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { countPending } from '@/lib/adminApi'
import { useAuth } from '@/lib/auth'
import Spinner from './Spinner'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center gap-2 ${isActive ? 'text-gold-dark underline underline-offset-4' : 'hover:text-gold'}`

const TOAST_MS = 4000

export interface AdminOutletContext {
  /** Vuelve a contar las reservas pendientes (tras una acción o al pulsar "Actualizar"). */
  refreshPending: () => void
}

// oxlint-disable-next-line react/only-export-components
export function useAdminContext(): AdminOutletContext {
  return useOutletContext<AdminOutletContext>()
}

export default function AdminLayout() {
  const { signOut } = useAuth()
  const location = useLocation()
  const [pending, setPending] = useState<number | null>(null)

  const refreshPending = useCallback(() => {
    countPending()
      .then(setPending)
      .catch(() => setPending(null))
  }, [])

  // Al navegar (p. ej. tras aceptar una reserva) y al volver a la pestaña del navegador
  useEffect(() => refreshPending(), [refreshPending, location.key])
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshPending()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshPending])

  // Aviso que llega en el state de la navegación: navigate('/admin', { state: { toast } })
  const toast = (location.state as { toast?: string } | null)?.toast
  const [hiddenToastKey, setHiddenToastKey] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setHiddenToastKey(location.key), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast, location.key])

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-gold-light/50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          <span className="font-display tracking-[0.25em] text-gold-dark">ADMIN</span>
          <nav className="flex flex-wrap items-center gap-x-5 text-xs uppercase tracking-[0.2em]">
            <NavLink to="/admin" end className={linkClass}>
              Reservas
              {pending !== null && pending > 0 && (
                <span
                  aria-label={`${pending} pendientes`}
                  className="rounded-full bg-xmas-red px-2 py-0.5 text-[0.7rem] font-semibold tracking-normal text-cream no-underline"
                >
                  {pending}
                </span>
              )}
            </NavLink>
            <NavLink to="/admin/disponibilidad" className={linkClass}>
              Disponibilidad
            </NavLink>
            <button
              type="button"
              onClick={signOut}
              className="min-h-11 uppercase tracking-[0.2em] hover:text-gold-dark"
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>

      {toast && hiddenToastKey !== location.key && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-10 mx-auto max-w-sm rounded-sm bg-ink px-4 py-3 text-center text-sm text-cream shadow-lg"
        >
          {toast}
        </div>
      )}

      <main className="flex-1">
        <Suspense fallback={<Spinner />}>
          <Outlet context={{ refreshPending } satisfies AdminOutletContext} />
        </Suspense>
      </main>
    </div>
  )
}
