import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Booking from './Booking'

// La reserva no llega a llamar a Supabase en estos tests
vi.mock('@/lib/api', () => ({ createBooking: vi.fn(), fetchAvailability: vi.fn() }))

beforeAll(() => {
  // jsdom no implementa <dialog>
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false
  }
})

function renderBooking(step: number) {
  sessionStorage.setItem(
    'reserva-navidad-2026',
    JSON.stringify({
      step,
      packageCode: 'P1',
      startsAt: '2026-11-07T09:00:00.000Z',
      client: null,
    }),
  )
  const router = createMemoryRouter(
    [
      {
        path: '/reservar',
        element: (
          <>
            <Link to="/">Inicio</Link>
            <Booking />
          </>
        ),
      },
      { path: '/', element: <p>Portada</p> },
    ],
    { initialEntries: ['/reservar'] },
  )
  render(<RouterProvider router={router} />)
}

const dialog = () => screen.queryByRole('dialog', { name: '¿Salir de la reserva?' })

describe('salir de la reserva', () => {
  beforeEach(() => sessionStorage.clear())

  it('a mitad de la reserva pide confirmación y se puede seguir reservando', () => {
    renderBooking(3)
    fireEvent.click(screen.getByRole('link', { name: 'Inicio' }))
    expect(dialog()).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Seguir reservando' }))
    expect(dialog()).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tus datos' })).toBeInTheDocument()
  })

  it('al confirmar sale de la reserva', async () => {
    renderBooking(3)
    fireEvent.click(screen.getByRole('link', { name: 'Inicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(await screen.findByText('Portada')).toBeInTheDocument()
  })

  it('en el primer paso sale sin preguntar', async () => {
    renderBooking(1)
    fireEvent.click(screen.getByRole('link', { name: 'Inicio' }))
    expect(await screen.findByText('Portada')).toBeInTheDocument()
    expect(dialog()).not.toBeInTheDocument()
  })
})
