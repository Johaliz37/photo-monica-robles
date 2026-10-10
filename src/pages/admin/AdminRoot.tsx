import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Spinner from '@/components/admin/Spinner'
import { AuthProvider } from '@/lib/auth'

/** Raíz de /admin/*: sesión de Supabase y noindex. Va en su propio chunk. */
export default function AdminRoot() {
  return (
    <AuthProvider>
      <meta name="robots" content="noindex" />
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  )
}
