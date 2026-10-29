import { describe, expect, it } from 'vitest'
import {
  FIXED_SECTIONS,
  groupSiteImages,
  moveItem,
  siteImageUrl,
  type PublicSiteImage,
} from './siteImages'

const img = (section: string, path: string, sort_order = 0): PublicSiteImage => ({
  section,
  path,
  alt: '',
  width: 1600,
  height: 1066,
  sort_order,
})

describe('groupSiteImages', () => {
  it('reparte por sección y ordena el carrusel', () => {
    const grouped = groupSiteImages([
      img('carousel', 'c.webp', 3),
      img('info', 'i.webp'),
      img('carousel', 'a.webp', 1),
      img('carousel', 'b.webp', 2),
    ])
    expect(grouped.info?.path).toBe('i.webp')
    expect(grouped.extras).toBeUndefined()
    expect(grouped.carousel.map((c) => c.path)).toEqual(['a.webp', 'b.webp', 'c.webp'])
  })

  it('ignora secciones desconocidas', () => {
    expect(groupSiteImages([img('otra', 'x.webp')])).toEqual({ carousel: [] })
  })
})

describe('siteImageUrl', () => {
  it('construye la URL pública del bucket', () => {
    expect(siteImageUrl('https://x.supabase.co/', 'a.webp')).toBe(
      'https://x.supabase.co/storage/v1/object/public/site-images/a.webp',
    )
  })

  it('devuelve null sin URL o sin archivo', () => {
    expect(siteImageUrl(undefined, 'a.webp')).toBeNull()
    expect(siteImageUrl('https://x.supabase.co', '')).toBeNull()
  })
})

describe('moveItem', () => {
  it('mueve un elemento sin salirse de la lista', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b'])
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
    expect(moveItem(['a', 'b', 'c'], 2, 5)).toEqual(['a', 'b', 'c'])
  })
})

describe('FIXED_SECTIONS', () => {
  it('la sesión de Navidad usa como respaldo la foto de su tarjeta de Espadilla', () => {
    expect(FIXED_SECTIONS.christmas_session.fallback).toBe('espadilla-trineo')
    expect(FIXED_SECTIONS.christmas_session.fallbackAlt).not.toBe('')
  })
})
