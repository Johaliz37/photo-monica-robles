type Props = {
  className?: string
}

/** Separador decorativo del catálogo: línea + ✦ + línea. */
export default function Divider({ className = '' }: Props) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-16 bg-gold-light sm:w-24" />
      <span className="text-sm text-gold">✦</span>
      <span className="h-px w-16 bg-gold-light sm:w-24" />
    </div>
  )
}
