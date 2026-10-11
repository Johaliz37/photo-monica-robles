import { Suspense, useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import ResponsiveImage from '@/components/ResponsiveImage'
import { countPending } from '@/lib/adminApi'
import { useAuth } from '@/lib/auth'
import Spinner from './Spinner'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center gap-2 ${isActive ? 'text-leaf underline underline-offset-4' : 'text-cream hover:text-leaf'}`

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

  // Menú desplegable: abierto solo en la navegación en la que se abrió (se cierra al cambiar de página)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const menuOpen = openKey === location.key
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenKey(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const pendingBadge = pending !== null && pending > 0
  const navItems = (
    <>
      <NavLink to="/admin" end className={linkClass}>
        Reservas
        {pendingBadge && (
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
      <NavLink to="/admin/dashboard" className={linkClass}>
        Dashboard
      </NavLink>
      <button
        type="button"
        onClick={signOut}
        className="min-h-11 text-left uppercase tracking-[0.2em] text-cream hover:text-leaf"
      >
        Cerrar sesión
      </button>
    </>
  )

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-teal">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-x-6 px-4 py-2">
          <Link to="/admin" className="flex shrink-0 items-center gap-3">
            <ResponsiveImage
              name="logo"
              alt="Mónica Robles Fotografía"
              priority
              sizes="(min-width: 640px) 170px, 120px"
              className="h-auto w-[120px] sm:w-[170px]"
            />
            <span className="rounded-full bg-leaf px-2.5 py-0.5 font-display text-[0.65rem] tracking-[0.25em] text-teal">
              ADMIN
            </span>
          </Link>
          {/* Menú en línea cuando cabe junto al logo (desde 880 px; por debajo haría salto de línea) */}
          <nav
            aria-label="Admin"
            className="hidden items-center gap-x-5 text-xs uppercase tracking-[0.2em] min-[880px]:flex"
          >
            {navItems}
          </nav>

          {/* En pantallas estrechas, botón que despliega el menú */}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            onClick={() => setOpenKey(menuOpen ? null : location.key)}
            className="relative inline-flex size-11 items-center justify-center rounded-sm text-cream hover:text-leaf min-[880px]:hidden"
          >
            <span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
            {!menuOpen && pendingBadge && (
              <span aria-hidden="true" className="absolute top-1 right-1 size-2.5 rounded-full bg-xmas-red ring-2 ring-teal" />
            )}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="admin-menu"
            aria-label="Admin"
            className="border-t border-cream/20 text-sm uppercase tracking-[0.2em] min-[880px]:hidden"
          >
            <div className="mx-auto flex max-w-5xl flex-col px-4 py-2">{navItems}</div>
          </nav>
        )}
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
