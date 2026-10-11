import type { BookingStatus } from '@/lib/adminApi'

const STATUS_LABEL: Record<BookingStatus, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
}

const STATUS_CLASS: Record<BookingStatus, string> = {
  pendiente: 'bg-xmas-red text-cream',
  aceptada: 'bg-pine/15 text-pine',
  rechazada: 'bg-xmas-red/10 text-xmas-red',
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
