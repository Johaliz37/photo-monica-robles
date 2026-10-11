// Perfil público de la fotógrafa (lógica pura, sin Supabase): valores por defecto,
// normalización de los usuarios de redes sociales y enlaces.
import { CONTACT, PAYMENT } from '@/content/site'
import type { Database } from './database.types'

export type PublicProfile = Database['public']['Functions']['get_public_profile']['Returns'][number]

// Mientras site.ts lleve 'TODO', el dato se considera vacío
const unlessTodo = (value: string) => (value === 'TODO' ? '' : value)

/** Lo que muestra la web mientras carga el perfil o si no se puede leer. */
export const DEFAULT_PROFILE: PublicProfile = {
  full_name: '',
  phone: '',
  email: '',
  bizum: unlessTodo(PAYMENT.bizum),
  instagram: CONTACT.instagram,
  facebook: '',
  tiktok: '',
  about: '',
  show_about: false,
  photo_path: '',
}

/** URL pública de la foto de perfil (bucket público `avatars`), o null si no hay. */
export function profilePhotoUrl(supabaseUrl: string | undefined, photoPath: string): string | null {
  if (!supabaseUrl || !photoPath) return null
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/avatars/${photoPath}`
}

/** "Sobre mí" se muestra si está activado y tiene texto o foto. */
export function showAboutSection(profile: PublicProfile): boolean {
  return profile.show_about && (profile.about.trim() !== '' || profile.photo_path !== '')
}

/**
 * Nombre de usuario a partir de lo que se pegue: "@monica", "monica" o la URL del perfil
 * ("https://www.instagram.com/monica/?hl=es") → "monica".
 */
export function normalizeHandle(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.|m\.)?(instagram|tiktok|facebook|fb)\.com\//i, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .replace(/^@/, '')
}

export const instagramUrl = (handle: string) => `https://www.instagram.com/${handle}/`
export const facebookUrl = (handle: string) => `https://www.facebook.com/${handle}`
export const tiktokUrl = (handle: string) => `https://www.tiktok.com/@${handle}`

/**
 * Enlace de WhatsApp, opcionalmente con un mensaje ya escrito. Los móviles de 9 cifras sin
 * prefijo se asumen españoles (+34).
 */
export function whatsappUrl(phone: string, text?: string): string {
  const trimmed = phone.trim()
  let digits = trimmed.replace(/\D/g, '')
  if (!trimmed.startsWith('+')) {
    if (digits.startsWith('00')) digits = digits.slice(2)
    else if (digits.length === 9) digits = `34${digits}`
  }
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}

/** Enlace "tel:" sin espacios: "+34 600 11 22 33" → "tel:+34600112233". */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export interface SocialLink {
  network: 'instagram' | 'facebook' | 'tiktok'
  label: string
  /** Texto visible: "@usuario". */
  handle: string
  url: string
}

/** Redes con usuario, en el orden en que se muestran. */
export function socialLinks(profile: PublicProfile): SocialLink[] {
  const links: SocialLink[] = []
  if (profile.instagram) {
    links.push({
      network: 'instagram',
      label: 'Instagram',
      handle: `@${profile.instagram}`,
      url: instagramUrl(profile.instagram),
    })
  }
  if (profile.facebook) {
    links.push({
      network: 'facebook',
      label: 'Facebook',
      handle: profile.facebook,
      url: facebookUrl(profile.facebook),
    })
  }
  if (profile.tiktok) {
    links.push({
      network: 'tiktok',
      label: 'TikTok',
      handle: `@${profile.tiktok}`,
      url: tiktokUrl(profile.tiktok),
    })
  }
  return links
}

/** Enlace de contacto preferente: Instagram, si no WhatsApp/teléfono, si no email. */
export function primaryContactUrl(profile: PublicProfile): string | null {
  if (profile.instagram) return instagramUrl(profile.instagram)
  if (profile.phone) return telHref(profile.phone)
  if (profile.email) return `mailto:${profile.email}`
  return null
}
