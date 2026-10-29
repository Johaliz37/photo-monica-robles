// Fotos de la home editables desde /admin/imagenes (lógica pura, sin Supabase).
import type { ImageName } from '@/content/images.generated'
import { ESPADILLA } from '@/content/site'
import type { Database } from './database.types'

export type PublicSiteImage = Database['public']['Functions']['get_site_images']['Returns'][number]

export type SiteImageSection = 'extras' | 'info' | 'christmas_session' | 'carousel'
/** Secciones con una sola foto; si no hay subida, se usa la del código. */
export type FixedSection = Exclude<SiteImageSection, 'carousel'>

export interface FixedSectionInfo {
  /** Nombre de la sección en el panel. */
  label: string
  /** Dónde aparece en la home, para el panel. */
  where: string
  /** Foto del código que se muestra si no se ha subido ninguna. */
  fallback: ImageName
  fallbackAlt: string
}

const christmasCard = ESPADILLA.cards.find((c) => c.slot === 'christmas_session')

export const FIXED_SECTIONS: Record<FixedSection, FixedSectionInfo> = {
  extras: {
    label: 'Adicionales',
    where: 'Junto a la lista de fotos extra y la galería completa.',
    fallback: 'studio-1',
    fallbackAlt: 'Niño pequeño riendo junto a un reno dorado y árboles de Navidad en el estudio',
  },
  info: {
    label: 'Información adicional',
    where: 'Encima de la forma de pago, las pruebas y la entrega.',
    fallback: 'studio-2',
    fallbackAlt:
      'Niña con jersey de corazones y falda de tul roja sentada entre regalos en el estudio navideño',
  },
  christmas_session: {
    label: 'Vuestra sesión de Navidad',
    where: 'Tarjeta «Y, por supuesto… vuestra sesión de Navidad» de la escapada a Espadilla.',
    fallback: christmasCard?.image ?? 'espadilla-trineo',
    fallbackAlt: christmasCard?.imageAlt ?? '',
  },
}

export const FIXED_SECTION_KEYS = Object.keys(FIXED_SECTIONS) as FixedSection[]

export type SiteImages = Partial<Record<FixedSection, PublicSiteImage>> & {
  carousel: PublicSiteImage[]
}

export const EMPTY_SITE_IMAGES: SiteImages = { carousel: [] }

/** Reparte las filas por sección; el carrusel queda ordenado por sort_order. */
export function groupSiteImages(rows: PublicSiteImage[]): SiteImages {
  const out: SiteImages = { carousel: [] }
  for (const row of rows) {
    if (row.section === 'carousel') out.carousel.push(row)
    else if (row.section in FIXED_SECTIONS) out[row.section as FixedSection] ??= row
  }
  out.carousel.sort((a, b) => a.sort_order - b.sort_order)
  return out
}

/** URL pública de una foto del bucket `site-images`, o null si no hay. */
export function siteImageUrl(supabaseUrl: string | undefined, path: string): string | null {
  if (!supabaseUrl || !path) return null
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/site-images/${path}`
}

/** Copia de la lista con el elemento `index` desplazado `delta` posiciones (sin salirse). */
export function moveItem<T>(list: readonly T[], index: number, delta: number): T[] {
  const target = Math.min(list.length - 1, Math.max(0, index + delta))
  const out = [...list]
  if (index < 0 || index >= list.length || target === index) return out
  const [item] = out.splice(index, 1)
  out.splice(target, 0, item)
  return out
}
