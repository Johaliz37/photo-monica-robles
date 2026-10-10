import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Legal from '@/pages/Legal'
import NotFound from '@/pages/NotFound'
import Privacy from '@/pages/Privacy'

// La reserva (con el cliente de Supabase) y el admin se cargan bajo demanda para no inflar la home
const Booking = lazy(() => import('@/pages/Booking'))
const AdminRoot = lazy(() => import('@/pages/admin/AdminRoot'))
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'))
const AdminGuard = lazy(() => import('@/components/admin/AdminGuard'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const AdminBookings = lazy(() => import('@/pages/admin/AdminBookings'))
const AdminBookingDetail = lazy(() => import('@/pages/admin/AdminBookingDetail'))
const AdminAvailability = lazy(() => import('@/pages/admin/AdminAvailability'))

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      {
        path: '/reservar',
        element: (
          <Suspense fallback={<PageFallback />}>
            <Booking />
          </Suspense>
        ),
      },
      { path: '/privacidad', element: <Privacy /> },
      { path: '/aviso-legal', element: <Legal /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<PageFallback />}>
        <AdminRoot />
      </Suspense>
    ),
    children: [
      { path: 'login', element: <AdminLogin /> },
      {
        element: (
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        ),
        children: [
          { index: true, element: <AdminBookings /> },
          { path: 'reservas/:id', element: <AdminBookingDetail /> },
          { path: 'disponibilidad', element: <AdminAvailability /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])

function PageFallback() {
  return <p className="p-8 text-center text-sm">Cargando…</p>
}

export default function App() {
  return <RouterProvider router={router} />
}
