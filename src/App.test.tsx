import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'

const DURING_PRESALE = new Date('2026-10-14T12:00:00+02:00')
const AFTER_PRESALE = new Date('2026-10-20T12:00:00+02:00')
import Legal from '@/pages/Legal'
import NotFound from '@/pages/NotFound'
import Privacy from '@/pages/Privacy'

function renderAt(path: string, now = DURING_PRESALE) {
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Home now={now} /> },
          { path: '/privacidad', element: <Privacy /> },
          { path: '/aviso-legal', element: <Legal /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

describe('layout público', () => {
  it('muestra la home con el CTA de reserva', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: /Navidad/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reservar' })).toHaveAttribute('href', '/reservar')
  })

  it('enlaza cada paquete con su reserva y muestra el precio de preventa', () => {
    renderAt('/')
    const links = screen.getAllByRole('link', { name: 'Reservar este paquete' })
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/reservar?paquete=P1',
      '/reservar?paquete=P2',
      '/reservar?paquete=P3',
    ])
    expect(screen.getByText(/76,50/)).toBeInTheDocument()
    expect(screen.getByText('DEL DOMINGO 11 AL VIERNES 16 DE OCTUBRE')).toBeInTheDocument()
  })

  it('tras la preventa muestra el precio normal y oculta el aviso', () => {
    renderAt('/', AFTER_PRESALE)
    expect(screen.queryByText(/76,50/)).not.toBeInTheDocument()
    expect(screen.queryByText('DEL DOMINGO 11 AL VIERNES 16 DE OCTUBRE')).not.toBeInTheDocument()
  })

  it('muestra un 404 en rutas inexistentes', () => {
    renderAt('/no-existe')
    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })

  it('muestra la política de privacidad completa', () => {
    renderAt('/privacidad')
    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeVisible()
    for (const title of [
      'Responsable del tratamiento',
      'Base legal',
      'Menores de edad',
      'Tus derechos',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
    expect(screen.getByText(/Agencia Española de Protección de Datos/)).toBeInTheDocument()
  })

  it('muestra el aviso legal con la propiedad de las imágenes', () => {
    renderAt('/aviso-legal')
    expect(screen.getByRole('heading', { level: 1, name: 'Aviso legal' })).toBeVisible()
    expect(
      screen.getByText(/imágenes de esta web son propiedad de Mónica Robles/),
    ).toBeInTheDocument()
  })
})
