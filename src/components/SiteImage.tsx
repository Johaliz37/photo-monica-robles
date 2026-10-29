import ResponsiveImage from '@/components/ResponsiveImage'
import type { ImageName } from '@/content/images.generated'
import { SITE_IMAGE_DEFAULT_ALT } from '@/content/site'
import { siteImageUrl, type PublicSiteImage } from '@/lib/siteImages'

type Props = {
  /** Foto subida en /admin/imagenes; si no hay, se usa `fallback`. */
  image: PublicSiteImage | undefined
  /** false mientras se consulta si hay foto subida: se reserva el hueco sin pintar ninguna. */
  ready: boolean
  fallback: ImageName
  fallbackAlt: string
  sizes?: string
  /** Debe fijar la proporción (aspect-*) para que el hueco no cambie de tamaño. */
  className?: string
}

/** Foto de sección editable desde el admin, con la del código como respaldo. */
export default function SiteImage({
  image,
  ready,
  fallback,
  fallbackAlt,
  sizes,
  className = '',
}: Props) {
  if (!ready) {
    return <div aria-hidden="true" className={`animate-pulse bg-cream-dark ${className}`} />
  }
  const url = image && siteImageUrl(import.meta.env.VITE_SUPABASE_URL, image.path)
  if (!image || !url) {
    return <ResponsiveImage name={fallback} alt={fallbackAlt} sizes={sizes} className={className} />
  }
  return (
    <img
      src={url}
      width={image.width}
      height={image.height}
      alt={image.alt || SITE_IMAGE_DEFAULT_ALT}
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
}
