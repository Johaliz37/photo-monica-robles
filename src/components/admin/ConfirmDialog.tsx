import { useEffect, useRef } from 'react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/booking/Stepper'

type Props = {
  open: boolean
  title: string
  confirmLabel: string
  cancelLabel?: string
  /** "danger" pinta el botón de confirmar en rojo. */
  tone?: 'primary' | 'danger'
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}

export default function ConfirmDialog({
  open,
  title,
  confirmLabel,
  cancelLabel = 'Volver',
  tone = 'primary',
  busy = false,
  error,
  onConfirm,
  onCancel,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const confirmClass =
    tone === 'danger' ? BUTTON_PRIMARY.replaceAll('bg-gold-dark', 'bg-xmas-red') : BUTTON_PRIMARY

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        // Escape: se cierra desde el estado del padre (o no se cierra si está enviando)
        e.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-sm bg-cream p-6 text-ink shadow-xl backdrop:bg-ink/50"
    >
      <h2
        id="confirm-dialog-title"
        className="font-display text-lg tracking-[0.15em] text-gold-dark"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm">{children}</div>
      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-xmas-red/10 p-3 text-sm text-xmas-red">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={busy} className={BUTTON_SECONDARY}>
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={confirmClass}>
          {busy ? 'Guardando…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
