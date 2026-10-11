import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROFILE,
  normalizeHandle,
  primaryContactUrl,
  profilePhotoUrl,
  showAboutSection,
  socialLinks,
  telHref,
} from './profile'

const EMPTY = { ...DEFAULT_PROFILE, instagram: '', bizum: '' }

describe('normalizeHandle', () => {
  it('acepta el usuario con o sin @', () => {
    expect(normalizeHandle('  @monica.robles ')).toBe('monica.robles')
    expect(normalizeHandle('monica_robles')).toBe('monica_robles')
  })

  it('extrae el usuario de la URL del perfil', () => {
    expect(normalizeHandle('https://www.instagram.com/monicarobles_fotografia/?hl=es')).toBe(
      'monicarobles_fotografia',
    )
    expect(normalizeHandle('https://www.tiktok.com/@monica')).toBe('monica')
    expect(normalizeHandle('facebook.com/monica.fotografia')).toBe('monica.fotografia')
    expect(normalizeHandle('https://m.facebook.com/monica#about')).toBe('monica')
  })
})

describe('telHref', () => {
  it('quita espacios y guiones', () => {
    expect(telHref('+34 600-11 22 33')).toBe('tel:+34600112233')
  })
})

describe('socialLinks', () => {
  it('solo incluye las redes con usuario, en orden', () => {
    const links = socialLinks({ ...EMPTY, instagram: 'moni', tiktok: 'moni_tt' })
    expect(links.map((l) => l.network)).toEqual(['instagram', 'tiktok'])
    expect(links[0]).toMatchObject({ handle: '@moni', url: 'https://www.instagram.com/moni/' })
    expect(links[1].url).toBe('https://www.tiktok.com/@moni_tt')
  })

  it('sin redes devuelve una lista vacía', () => {
    expect(socialLinks(EMPTY)).toEqual([])
  })
})

describe('primaryContactUrl', () => {
  it('prefiere Instagram, luego teléfono y luego email', () => {
    expect(primaryContactUrl({ ...EMPTY, instagram: 'moni', phone: '600112233' })).toBe(
      'https://www.instagram.com/moni/',
    )
    expect(primaryContactUrl({ ...EMPTY, phone: '600 11 22 33', email: 'a@b.es' })).toBe(
      'tel:600112233',
    )
    expect(primaryContactUrl({ ...EMPTY, email: 'a@b.es' })).toBe('mailto:a@b.es')
    expect(primaryContactUrl(EMPTY)).toBeNull()
  })
})

describe('profilePhotoUrl', () => {
  it('construye la URL pública del bucket avatars', () => {
    expect(profilePhotoUrl('https://abc.supabase.co/', 'f.webp')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/avatars/f.webp',
    )
  })

  it('sin foto o sin URL de Supabase devuelve null', () => {
    expect(profilePhotoUrl('https://abc.supabase.co', '')).toBeNull()
    expect(profilePhotoUrl(undefined, 'f.webp')).toBeNull()
  })
})

describe('showAboutSection', () => {
  it('solo se muestra si está activado y tiene texto o foto', () => {
    expect(showAboutSection({ ...EMPTY, show_about: true, about: 'Hola' })).toBe(true)
    expect(showAboutSection({ ...EMPTY, show_about: true, photo_path: 'f.webp' })).toBe(true)
    expect(showAboutSection({ ...EMPTY, show_about: true, about: '   ' })).toBe(false)
    expect(showAboutSection({ ...EMPTY, show_about: false, about: 'Hola' })).toBe(false)
  })
})
