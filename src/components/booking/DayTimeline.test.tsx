import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { madridDateTime } from '@/lib/dates'
import DayTimeline from './DayTimeline'

const DAY = '2026-11-07'
const at = (time: string) => madridDateTime(DAY, time)

function renderTimeline(onSelect = vi.fn()) {
  render(
    <DayTimeline
      day={DAY}
      windows={[{ start: at('10:00'), end: at('12:00') }]}
      busy={[{ start: at('10:30'), end: at('11:15') }]}
      slots={[at('11:15'), at('11:30')]}
      durationMin={30}
      bufferMin={15}
      stepMin={15}
      selected={null}
      onSelect={onSelect}
    />,
  )
  return onSelect
}

describe('DayTimeline', () => {
  it('solo ofrece como botón las horas de inicio válidas', () => {
    renderTimeline()
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Sesión de 11:15 – 11:45',
      'Sesión de 11:30 – 12:00',
    ])
  })

  it('muestra las reservas existentes sin el margen posterior', () => {
    renderTimeline()
    expect(screen.getByText('10:30 – 11:00')).toBeInTheDocument()
  })

  it('al pasar el cursor muestra la franja y al pulsar la elige', () => {
    const onSelect = renderTimeline()
    const slot = screen.getByRole('button', { name: 'Sesión de 11:30 – 12:00' })
    fireEvent.mouseEnter(slot)
    expect(screen.getByText('11:30 – 12:00')).toBeInTheDocument()
    fireEvent.click(slot)
    expect(onSelect).toHaveBeenCalledWith(at('11:30').toISOString())
  })
})
