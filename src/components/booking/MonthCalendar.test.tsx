import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MonthCalendar from './MonthCalendar'

const AVAILABLE = new Set(['2026-11-07', '2026-11-14'])

function Harness({ onSelectDay = () => {} }: { onSelectDay?: (day: string) => void }) {
  const [month, setMonth] = useState('2026-11')
  return (
    <MonthCalendar
      month={month}
      minMonth="2026-10"
      maxMonth="2026-12"
      availableDays={AVAILABLE}
      onMonthChange={setMonth}
      onSelectDay={onSelectDay}
    />
  )
}

const day = (name: RegExp) => screen.getByRole('button', { name })

describe('MonthCalendar con teclado', () => {
  it('solo el primer día disponible está en el orden de tabulación', () => {
    render(<Harness />)
    expect(day(/^sábado 7 de noviembre$/)).toHaveAttribute('tabindex', '0')
    expect(day(/^sábado 14 de noviembre$/)).toHaveAttribute('tabindex', '-1')
  })

  it('mueve el foco con las flechas, también por días no disponibles', () => {
    render(<Harness />)
    day(/^sábado 7 de noviembre$/).focus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(day(/^domingo 8 de noviembre/))
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(day(/^domingo 15 de noviembre/))
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(document.activeElement).toBe(day(/^lunes 9 de noviembre/))
  })

  it('cambia de mes al salir del mes visible y no pasa de los límites', () => {
    render(<Harness />)
    day(/^sábado 7 de noviembre$/).focus()
    fireEvent.keyDown(document.activeElement!, { key: 'PageDown' })
    expect(screen.getByText('diciembre 2026')).toBeInTheDocument()
    expect(document.activeElement).toBe(day(/^lunes 7 de diciembre/))
    fireEvent.keyDown(document.activeElement!, { key: 'PageDown' })
    expect(document.activeElement).toBe(day(/^lunes 7 de diciembre/))
  })

  it('solo selecciona días disponibles', () => {
    const onSelectDay = vi.fn()
    render(<Harness onSelectDay={onSelectDay} />)
    fireEvent.click(day(/^domingo 8 de noviembre/))
    expect(onSelectDay).not.toHaveBeenCalled()
    fireEvent.click(day(/^sábado 7 de noviembre$/))
    expect(onSelectDay).toHaveBeenCalledWith('2026-11-07')
  })
})
