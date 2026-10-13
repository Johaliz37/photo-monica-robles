import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/booking/Stepper'
import type { GuideStep } from '@/content/availabilityGuide'

type Props = {
  title: string
  steps: GuideStep[]
  /** Se llama al terminar o al saltar la guía. */
  onClose: () => void
}

interface Box {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6

function targetElement(step: GuideStep): HTMLElement | null {
  return step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null
}

/** Guía paso a paso que resalta cada parte de la pantalla y la explica en una tarjeta. */
export default function GuidedTour({ title, steps, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const step = steps[index]
  const last = index === steps.length - 1

  // Acerca el elemento del paso y sigue su posición al desplazar o redimensionar
  useLayoutEffect(() => {
    const el = targetElement(step)
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    const measure = () => {
      const r = el?.getBoundingClientRect()
      setBox(
        r && r.width > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null,
      )
    }
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [step])

  useEffect(() => nextRef.current?.focus(), [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // La tarjeta va abajo salvo que el elemento resaltado esté en la mitad inferior
  const cardOnTop = box !== null && box.top + box.height / 2 > window.innerHeight / 2

  return (
    <div className="fixed inset-0 z-40">
      {box ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-md ring-4 ring-leaf transition-all duration-300"
          style={{
            top: box.top - PAD,
            left: box.left - PAD,
            width: box.width + PAD * 2,
            height: box.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.5)',
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-ink/50" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        className={`fixed inset-x-4 mx-auto max-w-md rounded-sm bg-cream p-5 text-ink shadow-xl ${
          cardOnTop ? 'top-4' : 'bottom-4'
        }`}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-teal">
          {title} · Paso {index + 1} de {steps.length}
        </p>
        <h2
          id="guided-tour-title"
          className="mt-1 font-display text-lg tracking-[0.1em] text-gold-dark"
        >
          {step.title}
        </h2>
        <div className="mt-2 space-y-2 text-sm leading-relaxed">
          {step.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div aria-hidden="true" className="mt-4 flex gap-1">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-teal' : 'bg-teal/20'}`}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {last ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-2 text-xs underline underline-offset-4 hover:text-gold-dark"
            >
              Saltar guía
            </button>
          )}
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className={BUTTON_SECONDARY}
              >
                Anterior
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? onClose() : setIndex(index + 1))}
              className={BUTTON_PRIMARY}
            >
              {last ? 'Terminar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
