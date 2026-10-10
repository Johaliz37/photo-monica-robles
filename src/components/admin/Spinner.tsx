export default function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-sm">
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-2 border-gold-light border-t-gold-dark"
      />
      {label}
    </div>
  )
}
