import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteAvailabilityRule,
  fetchActiveBookings,
  fetchAvailabilityRules,
  saveAvailabilityRule,
  type Booking,
} from '@/lib/adminApi'
import { AVAILABILITY_GUIDE, GUIDE_SEEN_KEY } from '@/content/availabilityGuide'
import type { Rule } from '@/lib/availability'
import AdminAvailability from './AdminAvailability'

vi.mock('@/lib/adminApi', () => ({
  fetchAvailabilityRules: vi.fn(),
  fetchActiveBookings: vi.fn(),
  saveAvailabilityRule: vi.fn(),
  deleteAvailabilityRule: vi.fn(),
}))

// Todos los lunes de octubre de 09:00 a 14:00
const SERIES: Rule = {
  id: 'serie',
  kind: 'disponible',
  day: '2026-10-19',
  start: '09:00',
  end: '14:00',
  repeat: 'mes',
  until: null,
}

// Lunes 26 de octubre, 10:00–10:30 (ya en horario de invierno, UTC+1)
const BOOKING = {
  id: '3f2a9c1b-0000-0000-0000-000000000000',
  package_code: 'P1',
  starts_at: '2026-10-26T09:00:00Z',
  ends_at: '2026-10-26T09:30:00Z',
  client_name: 'Lucía Pérez',
  status: 'aceptada',
} as Booking

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-13T08:00:00Z'))
  // jsdom no implementa <dialog>
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false
  }
})

afterAll(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  vi.mocked(fetchAvailabilityRules).mockResolvedValue([SERIES])
  vi.mocked(fetchActiveBookings).mockResolvedValue([BOOKING])
  vi.mocked(saveAvailabilityRule).mockReset().mockResolvedValue()
  vi.mocked(deleteAvailabilityRule).mockReset().mockResolvedValue()
  // La guía se abre sola la primera vez: aquí se da por vista salvo en sus propios tests
  localStorage.setItem(GUIDE_SEEN_KEY, '1')
})

async function openDay(label: RegExp) {
  render(
    <MemoryRouter>
      <AdminAvailability />
    </MemoryRouter>,
  )
  fireEvent.click(await screen.findByRole('button', { name: label }))
}

describe('disponibilidad', () => {
  it('muestra el mes actual con los rangos de cada día', async () => {
    render(
      <MemoryRouter>
        <AdminAvailability />
      </MemoryRouter>,
    )
    expect(await screen.findByText('octubre 2026')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'lunes 26 de octubre: 1 rango, 1 reserva' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'martes 27 de octubre' })).toBeInTheDocument()
  })

  it('crea un rango no disponible en serie hasta una fecha', async () => {
    await openDay(/^lunes 19 de octubre/)
    fireEvent.click(screen.getByRole('button', { name: '+ Añadir rango' }))
    const form = screen.getByRole('heading', { name: 'Nuevo rango' }).closest('form')!

    fireEvent.click(within(form).getByLabelText('No disponible'))
    fireEvent.click(within(form).getByLabelText('En serie'))
    fireEvent.change(within(form).getByLabelText('Hasta la fecha'), {
      target: { value: '2026-11-02' },
    })
    // 10:00–11:00 pisa la reserva del 26: no deja guardar y explica por qué
    expect(within(form).getByRole('alert')).toHaveTextContent('3F2A9C1B')
    expect(within(form).getByRole('alert')).toHaveTextContent('Lucía Pérez')
    expect(within(form).getByRole('button', { name: 'Guardar' })).toBeDisabled()

    fireEvent.change(within(form).getByLabelText('Desde'), { target: { value: '12:00' } })
    fireEvent.change(within(form).getByLabelText('Hasta'), { target: { value: '13:00' } })
    expect(form).toHaveTextContent('Se aplica a 3 días: lun 19 oct, lun 26 oct, lun 2 nov.')
    fireEvent.click(within(form).getByRole('button', { name: 'Guardar' }))

    expect(saveAvailabilityRule).toHaveBeenCalledWith(null, {
      kind: 'no_disponible',
      day: '2026-10-19',
      start: '12:00',
      end: '13:00',
      repeat: 'hasta',
      until: '2026-11-02',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Rango creado.')
  })

  it('al editar una serie avisa de los días que se quitan y pide confirmación', async () => {
    await openDay(/^lunes 19 de octubre/)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    const form = screen.getByRole('heading', { name: 'Editar rango' }).closest('form')!
    fireEvent.click(within(form).getByLabelText('Único (solo este día)'))
    expect(form).toHaveTextContent('La serie dejará de aplicarse a este día: lun 26 oct.')

    fireEvent.click(within(form).getByRole('button', { name: 'Guardar' }))
    // Quitar el día 26 deja la reserva sin franja: el botón está deshabilitado
    expect(within(form).getByRole('button', { name: 'Guardar' })).toBeDisabled()
    expect(saveAvailabilityRule).not.toHaveBeenCalled()
  })

  it('al editar una serie sin reservas afectadas pide confirmación antes de guardar', async () => {
    vi.mocked(fetchActiveBookings).mockResolvedValue([])
    await openDay(/^lunes 19 de octubre/)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    const form = screen.getByRole('heading', { name: 'Editar rango' }).closest('form')!
    fireEvent.click(within(form).getByLabelText('Único (solo este día)'))
    fireEvent.click(within(form).getByRole('button', { name: 'Guardar' }))

    const dialog = screen.getByRole('dialog', { name: '¿Modificar la serie?' })
    expect(dialog).toHaveTextContent('lun 26 oct')
    expect(saveAvailabilityRule).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sí, guardar' }))
    expect(saveAvailabilityRule).toHaveBeenCalledWith('serie', {
      ...SERIES,
      id: undefined,
      repeat: 'unico',
    })
  })

  it('eliminar una serie con reservas avisa y no deja confirmar', async () => {
    await openDay(/^lunes 26 de octubre/)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialog = screen.getByRole('dialog', { name: '¿Eliminar la serie completa?' })
    expect(dialog).toHaveTextContent('Se eliminará en estos 2 días: lun 19 oct, lun 26 oct')
    expect(within(dialog).getByRole('alert')).toHaveTextContent('No se puede eliminar la serie')
    expect(within(dialog).getByRole('button', { name: 'Eliminar la serie' })).toBeDisabled()
  })

  it('eliminar un rango único pide confirmación', async () => {
    vi.mocked(fetchAvailabilityRules).mockResolvedValue([{ ...SERIES, repeat: 'unico' }])
    await openDay(/^lunes 19 de octubre/)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialog = screen.getByRole('dialog', { name: '¿Eliminar el rango?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    expect(deleteAvailabilityRule).toHaveBeenCalledWith('serie')
  })

  it('selecciona el rango arrastrando o tocando inicio y fin en la rejilla del día', async () => {
    await openDay(/^martes 20 de octubre/)
    const picker = screen.getByTestId('range-picker')
    // Cada 15 min son 8 px desde las 07:00 (jsdom sitúa la rejilla en y = 0)
    picker.setPointerCapture = vi.fn()
    fireEvent.pointerDown(picker, { clientY: 8 * 12, pointerType: 'mouse' })
    fireEvent.pointerMove(picker, { clientY: 8 * 15, pointerType: 'mouse' })
    fireEvent.pointerUp(picker, { clientY: 8 * 15, pointerType: 'mouse' })
    const form = screen.getByRole('heading', { name: 'Nuevo rango' }).closest('form')!
    expect(within(form).getByLabelText('Desde')).toHaveValue('10:00')
    expect(within(form).getByLabelText('Hasta')).toHaveValue('11:00')

    // En el móvil: un toque en la hora de inicio y otro en la de fin
    for (const y of [8 * 20, 8 * 27]) {
      fireEvent.pointerDown(picker, { clientY: y, pointerType: 'touch' })
      fireEvent.pointerUp(picker, { clientY: y, pointerType: 'touch' })
    }
    expect(within(form).getByLabelText('Desde')).toHaveValue('12:00')
    expect(within(form).getByLabelText('Hasta')).toHaveValue('14:00')
  })
})

describe('guía de disponibilidad', () => {
  const renderPage = (url = '/admin/disponibilidad') =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <AdminAvailability />
      </MemoryRouter>,
    )

  it('se abre sola la primera vez y al terminar explica dónde volver a verla', async () => {
    localStorage.removeItem(GUIDE_SEEN_KEY)
    renderPage()
    const dialog = await screen.findByRole('dialog', { name: AVAILABILITY_GUIDE[0].title })
    expect(dialog).toHaveTextContent(`Paso 1 de ${AVAILABILITY_GUIDE.length}`)

    for (let i = 1; i < AVAILABILITY_GUIDE.length; i++) {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Siguiente' }))
    }
    const lastStep = screen.getByRole('dialog', { name: '¡Listo!' })
    expect(lastStep).toHaveTextContent('Manuales → Guía de disponibilidad')
    fireEvent.click(within(lastStep).getByRole('button', { name: 'Terminar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem(GUIDE_SEEN_KEY)).toBe('1')
  })

  it('no se abre si ya se ha visto, pero sí desde el menú (?guia=1)', async () => {
    renderPage()
    await screen.findByText('octubre 2026')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    cleanup()

    renderPage('/admin/disponibilidad?guia=1')
    const dialog = await screen.findByRole('dialog', { name: AVAILABILITY_GUIDE[0].title })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Saltar guía' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
