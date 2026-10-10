/** Bloque gris animado que ocupa el sitio del contenido mientras carga. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-sm bg-cream-dark ${className}`} />
  )
}

/** Contenedor de skeletons: anuncia la carga a los lectores de pantalla. */
export function SkeletonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/** Silueta del calendario mensual con la columna de horas. */
export function CalendarSkeleton() {
  return (
    <SkeletonGroup label="Cargando horarios…">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm bg-white/50 p-3 ring-1 ring-gold-light/50 sm:p-4">
          <div className="mb-3 flex h-11 items-center justify-center">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </SkeletonGroup>
  )
}
