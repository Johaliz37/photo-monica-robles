import { useStep } from './stepContext'

export const BUTTON_PRIMARY =
  'min-h-11 rounded-full bg-gold-dark px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold-dark'
export const BUTTON_SECONDARY =
  'min-h-11 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark ring-1 ring-gold-light transition hover:bg-cream-dark'

/** "Paso X de N", título del paso y barra de progreso. */
export default function Stepper() {
  const { step, total, title, headingRef } = useStep()
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
        Paso {step} de {total}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-display text-lg leading-tight tracking-[0.15em] text-gold-dark outline-none sm:text-xl"
      >
        {title}
      </h2>
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

/**
 * Barra de cada paso: progreso + botones Atrás / Siguiente. Va al principio del paso y se queda
 * fija arriba al hacer scroll, así no hace falta bajar hasta el final para avanzar.
 * Sin onNext, el botón es de tipo submit.
 */
export function StepNav({ onBack, onNext, nextLabel = 'Siguiente', nextDisabled, hint }: NavProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-gold-light/40 bg-cream/95 px-4 py-3 backdrop-blur-sm">
      {/* Móvil: progreso arriba y botones debajo. Desde sm: todo en una fila. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="w-full sm:order-2 sm:w-auto sm:flex-1">
          <Stepper />
        </div>
        <div className="sm:order-1">
          {onBack && (
            <button type="button" onClick={onBack} className={BUTTON_SECONDARY}>
              Atrás
            </button>
          )}
        </div>
        <button
          type={onNext ? 'button' : 'submit'}
          onClick={onNext}
          disabled={nextDisabled}
          className={`sm:order-3 ${BUTTON_PRIMARY}`}
        >
          {nextLabel}
        </button>
      </div>
      {hint && <p className="mt-2 text-right text-xs text-ink/70">{hint}</p>}
    </div>
  )
}
