import { useEffect, useId, useRef, useState } from 'react'
import { WHATSAPP_QUESTIONS } from '@/content/site'
import { whatsappUrl } from '@/lib/profile'
import WhatsAppIcon from './WhatsAppIcon'

/**
 * Botón flotante de WhatsApp que despliega consultas rápidas. Al elegir una se abre WhatsApp
 * con ese texto ya escrito. Sin teléfono en el perfil no se muestra.
 */
export default function WhatsAppWidget({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Se pliega con Escape o al pulsar fuera
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  if (!phone) return null

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6"
    >
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Consultas por WhatsApp"
          className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg bg-cream shadow-xl ring-1 ring-gold-light/50"
        >
          <div className="flex items-center gap-2 bg-teal px-4 py-3 text-cream">
            <WhatsAppIcon className="size-5 text-whatsapp" />
            <p className="font-display text-sm tracking-[0.1em]">¿En qué te ayudo?</p>
          </div>
          <ul className="flex flex-col gap-2 p-3">
            {WHATSAPP_QUESTIONS.map((question) => (
              <li key={question}>
                <a
                  href={whatsappUrl(phone, question)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block rounded-md bg-white/70 px-3 py-2 text-sm text-ink ring-1 ring-gold-light/40 transition hover:bg-whatsapp/10 hover:ring-whatsapp/50"
                >
                  {question}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? 'Cerrar consultas por WhatsApp' : 'Consultar por WhatsApp'}
        className="inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:scale-105"
      >
        {open ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <WhatsAppIcon className="size-7" />
        )}
      </button>
    </div>
  )
}
