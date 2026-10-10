import { IMAGES, type ImageName } from '@/content/images.generated'

type Props = {
  name: ImageName
  alt: string
  /** Atributo `sizes` del navegador; por defecto ocupa todo el ancho. */
  sizes?: string
  className?: string
  /** Para la imagen principal (hero): carga inmediata y prioritaria. */
  priority?: boolean
}

/** Imagen WebP con srcset (640/1280) y dimensiones reales para evitar saltos de layout. */
export default function ResponsiveImage({
  name,
  alt,
  sizes = '100vw',
  className,
  priority,
}: Props) {
  const img = IMAGES[name]
  const srcSet = img.srcSet.map((s) => `${s.src} ${s.width}w`).join(', ')
  const fallback = img.srcSet[img.srcSet.length - 1].src
  return (
    <img
      src={fallback}
      srcSet={srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      className={className}
    />
  )
}
