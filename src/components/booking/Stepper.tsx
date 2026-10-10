export const BUTTON_PRIMARY =
  'min-h-11 rounded-full bg-gold-dark px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold-dark'
export const BUTTON_SECONDARY =
  'min-h-11 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark ring-1 ring-gold-light transition hover:bg-cream-dark'

type Props = {
  step: number
  total: number
  label: string
}

export default function Stepper({ step, total, label }: Props) {
  return (
    <div className="mb-8">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
        Paso {step} de {total}
        <span className="sr-only">: {label}</span>
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label="Progreso de la reserva"
        className="mt-2 h-1 overflow-hidden rounded-full bg-cream-dark"
      >
        <div
          className="h-full bg-gold transition-[width] duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

type NavProps = {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  /** Texto bajo los botones (p. ej. qué falta para avanzar). */
  hint?: string
}

/** Botones Atrás / Siguiente al pie de cada paso. Sin onNext, el botón es de tipo submit. */
export function StepNav({ onBack, onNext, nextLabel = 'Siguiente', nextDisabled, hint }: NavProps) {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-4">
        {onBack ? (
          <button type="button" onClick={onBack} className={BUTTON_SECONDARY}>
            Atrás
          </button>
        ) : (
          <span />
        )}
        <button
          type={onNext ? 'button' : 'submit'}
          onClick={onNext}
          disabled={nextDisabled}
          className={BUTTON_PRIMARY}
        >
          {nextLabel}
        </button>
      </div>
      {hint && <p className="mt-3 text-right text-xs text-ink/70">{hint}</p>}
    </div>
  )
}
