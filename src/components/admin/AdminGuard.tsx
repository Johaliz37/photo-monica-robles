import { Navigate, useLocation } from 'react-router-dom'
import { BUTTON_PRIMARY } from '@/components/booking/Stepper'
import { useAuth } from '@/lib/auth'
import Spinner from './Spinner'

/** Solo UX: la barrera real es la RLS con is_admin(). */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-xl tracking-[0.2em] text-gold-dark">Sin acceso</h1>
        <p className="my-6 text-sm">
          Has iniciado sesión como <strong className="font-semibold">{session.user.email}</strong>,
          pero este usuario no tiene permisos de administración.
        </p>
        <button type="button" onClick={signOut} className={BUTTON_PRIMARY}>
          Cerrar sesión
        </button>
      </section>
    )
  }

  return <>{children}</>
}
