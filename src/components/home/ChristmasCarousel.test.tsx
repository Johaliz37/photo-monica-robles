import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CAROUSEL } from '@/content/site'
import type { PublicSiteImage } from '@/lib/siteImages'
import ChristmasCarousel from './ChristmasCarousel'

const images: PublicSiteImage[] = ['a', 'b', 'c'].map((name, i) => ({
  section: 'carousel',
  path: `${name}.webp`,
  alt: `Foto ${name}`,
  width: 1333,
  height: 2000,
  sort_order: i + 1,
}))

function renderAlbum(list: PublicSiteImage[]) {
  return render(
    <MemoryRouter>
      <ChristmasCarousel images={list} />
    </MemoryRouter>,
  )
}

/** Pulsa un botón y deja terminar el giro de la hoja. */
function turn(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
  act(() => {
    vi.advanceTimersByTime(CAROUSEL.flipMs)
  })
}

// jsdom no tiene matchMedia: el álbum se ve a una página y con animación
describe('ChristmasCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('no se muestra sin fotos', () => {
    const { container } = renderAlbum([])
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra la primera hoja, su pie y el enlace a la reserva', () => {
    renderAlbum(images)
    expect(screen.getByRole('heading', { name: /Momentos mágicos/ })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Foto 1 de 3' })).toBeInTheDocument()
    expect(screen.getByText('Foto a')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: CAROUSEL.cta })).toHaveAttribute('href', '/reservar')
  })

  it('pasa hojas hacia delante y hacia atrás, en bucle, y salta con los puntos', () => {
    renderAlbum(images)
    const current = () => screen.getByRole('button', { current: true })
    expect(current()).toHaveAccessibleName('Ir a la página 1')

    turn('Página siguiente')
    expect(current()).toHaveAccessibleName('Ir a la página 2')
    expect(screen.getByRole('group', { name: 'Foto 2 de 3' })).toBeInTheDocument()

    turn('Página anterior')
    turn('Página anterior')
    expect(current()).toHaveAccessibleName('Ir a la página 3')

    turn('Ir a la página 2')
    expect(current()).toHaveAccessibleName('Ir a la página 2')
  })

  it('pasa sola de hoja y se puede pausar', () => {
    renderAlbum(images)
    act(() => {
      vi.advanceTimersByTime(CAROUSEL.autoplayMs)
    })
    act(() => {
      vi.advanceTimersByTime(CAROUSEL.flipMs)
    })
    expect(screen.getByRole('group', { name: 'Foto 2 de 3' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pausar el pase automático' }))
    act(() => {
      vi.advanceTimersByTime((CAROUSEL.autoplayMs + CAROUSEL.flipMs) * 2)
    })
    expect(screen.getByRole('group', { name: 'Foto 2 de 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reanudar el pase automático' })).toBeInTheDocument()
  })
})
