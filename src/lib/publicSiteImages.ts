// Lectura de las fotos de la home desde la web pública. Como publicProfile.ts, usa fetch
// contra la RPC de PostgREST para no cargar el cliente de Supabase en la home.
import { useEffect, useState } from 'react'
import {
  EMPTY_SITE_IMAGES,
  groupSiteImages,
  type PublicSiteImage,
  type SiteImages,
} from './siteImages'

let cached: Promise<SiteImages> | null = null

async function fetchSiteImages(): Promise<SiteImages> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return EMPTY_SITE_IMAGES

  const res = await fetch(`${url}/rest/v1/rpc/get_site_images`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!res.ok) throw new Error(`get_site_images: ${res.status}`)
  return groupSiteImages((await res.json()) as PublicSiteImage[])
}

/** Una sola petición por carga de página; si falla, se usan las fotos del código. */
export function loadSiteImages(): Promise<SiteImages> {
  cached ??= fetchSiteImages().catch(() => {
    cached = null // reintenta en la próxima pantalla que lo pida
    return EMPTY_SITE_IMAGES
  })
  return cached
}

/** Olvida las fotos cargadas (tras cambiarlas en el admin). */
export function invalidatePublicSiteImages(): void {
  cached = null
}

export interface SiteImagesState {
  /** false mientras llega la respuesta: las secciones reservan el hueco sin pintar foto. */
  ready: boolean
  images: SiteImages
}

/** Fotos de la home. Mientras carga, `ready` es false y no hay fotos subidas. */
export function usePublicSiteImages(): SiteImagesState {
  const [state, setState] = useState<SiteImagesState>({ ready: false, images: EMPTY_SITE_IMAGES })
  useEffect(() => {
    let cancelled = false
    void loadSiteImages().then((images) => !cancelled && setState({ ready: true, images }))
    return () => {
      cancelled = true
    }
  }, [])
  return state
}
