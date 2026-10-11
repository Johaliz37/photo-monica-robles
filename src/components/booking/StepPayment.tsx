import { useState } from 'react'
import type { Package } from '@/content/packages'
import { BOOKING, PAYMENT } from '@/content/site'
import { formatEURCompact } from '@/lib/money'
import { primaryContactUrl } from '@/lib/profile'
import { usePublicProfile } from '@/lib/publicProfile'
import BookingSummary from './BookingSummary'
import ReceiptUpload from './ReceiptUpload'
import { StepNav } from './Stepper'

// Mientras Mónica no facilite los datos, site.ts lleva 'TODO'
const isSet = (value: string) => value.trim() !== '' && value !== 'TODO'

type Props = {
  pkg: Package
  baby: boolean
  startsAt: string
  clientName: string
  now: Date
  receiptPath: string | null
  onReceipt: (path: string | null) => void
  onBack: () => void
  /** Envía la reserva. Devuelve el mensaje de error si hay que quedarse en este paso. */
  onSubmit: () => Promise<string | null>
}

export default function StepPayment({
  pkg,
  baby,
  startsAt,
  clientName,
  now,
  receiptPath,
  onReceipt,
  onBack,
  onSubmit,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [website, setWebsite] = useState('')

  const deposit = formatEURCompact(BOOKING.depositCents)
  const concept = `Navidad ${clientName}`.trim()
  // El Bizum viene del perfil (/admin/perfil); IBAN y titular, de site.ts
  const profile = usePublicProfile()
  const hasBizum = isSet(profile.bizum)
  const hasIban = isSet(PAYMENT.iban)
  const contactUrl = primaryContactUrl(profile)

  async function handleSubmit() {
    if (submitting || !receiptPath) return
    // Honeypot: un humano no ve este campo
    if (website) return
    setSubmitting(true)
    setError(null)
    const message = await onSubmit()
    setSubmitting(false)
    setError(message)
  }

  return (
    <div className="space-y-6">
      <StepNav
        onBack={onBack}
        onNext={() => void handleSubmit()}
        nextLabel={submitting ? 'Enviando…' : 'Enviar reserva'}
        nextDisabled={!receiptPath || submitting}
        hint={receiptPath ? undefined : 'Sube el comprobante para poder enviar la reserva.'}
      />
      {/* Junto a los botones: es donde mira quien acaba de pulsar «Enviar reserva» */}
      {error && (
        <p role="alert" className="rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {error}
        </p>
      )}
      <section
        aria-labelledby="pago-adelanto"
        className="rounded-sm bg-cream-dark p-5 ring-1 ring-gold-light/50"
      >
        <h3 id="pago-adelanto" className="font-display tracking-[0.15em] text-gold-dark">
          Pago del adelanto
        </h3>
        <p className="mt-2 text-sm">
          Para reservar tu plaza, haz un pago de{' '}
          <strong className="font-semibold">{deposit}</strong> y sube el comprobante.
        </p>

        {hasBizum || hasIban ? (
          <dl className="mt-4 space-y-3 text-sm">
            {hasBizum && <PaymentRow label="Bizum" value={profile.bizum} />}
            {hasIban && <PaymentRow label="Transferencia (IBAN)" value={PAYMENT.iban} />}
            {isSet(PAYMENT.holder) && (
              <PaymentRow label="Titular" value={PAYMENT.holder} copy={false} />
            )}
            <PaymentRow label="Concepto" value={concept} />
          </dl>
        ) : (
          <p className="mt-4 text-sm">
            {contactUrl ? (
              <a
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
                className="font-normal text-gold-dark underline"
              >
                Escríbenos
              </a>
            ) : (
              'Escríbenos'
            )}{' '}
            para recibir los datos de pago. Concepto:{' '}
            <strong className="font-semibold">{concept}</strong>
          </p>
        )}
      </section>

      <BookingSummary pkg={pkg} baby={baby} startsAt={startsAt} now={now} />

      <ReceiptUpload receiptPath={receiptPath} onChange={onReceipt} />

      {/* Honeypot anti-bots: oculto para las personas y para los lectores de pantalla */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Web
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}

function PaymentRow({
  label,
  value,
  copy = true,
}: {
  label: string
  value: string
  copy?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles: el dato sigue visible para copiarlo a mano
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <dt className="text-ink/70">{label}</dt>
      <dd className="flex items-center gap-2">
        <strong className="font-semibold break-all">{value}</strong>
        {copy && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label={`Copiar ${label.toLowerCase()}`}
            className="min-h-11 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.15em] text-gold-dark hover:bg-cream"
          >
            <span aria-live="polite">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        )}
      </dd>
    </div>
  )
}
