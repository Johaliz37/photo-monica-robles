import { useEffect, useState } from 'react'
import { RECEIPT_ACCEPT, uploadReceipt, validateReceipt } from '@/lib/api'
import { errorMessage } from '@/lib/errors'
import { BUTTON_SECONDARY } from './Stepper'

type Status = 'idle' | 'uploading' | 'done' | 'error'
type Preview = { kind: 'image'; url: string; name: string } | { kind: 'pdf'; name: string }

type Props = {
  receiptPath: string | null
  onChange: (path: string | null) => void
}

export default function ReceiptUpload({ receiptPath, onChange }: Props) {
  const [status, setStatus] = useState<Status>(receiptPath ? 'done' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)

  // Libera la URL de la miniatura anterior
  useEffect(() => {
    if (preview?.kind !== 'image') return
    return () => URL.revokeObjectURL(preview.url)
  }, [preview])

  // Si la ruta se invalida desde fuera (p. ej. RECEIPT_MISSING), se pide subir otro
  const shownStatus = status === 'done' && !receiptPath ? 'idle' : status

  async function handleFile(file: File) {
    onChange(null)
    setError(null)
    try {
      validateReceipt(file)
    } catch (err) {
      setStatus('error')
      setError(errorMessage(err))
      setPreview(null)
      return
    }
    setPreview(
      file.type === 'application/pdf'
        ? { kind: 'pdf', name: file.name }
        : { kind: 'image', url: URL.createObjectURL(file), name: file.name },
    )
    setStatus('uploading')
    try {
      // Cada subida usa un uuid nuevo: "Cambiar archivo" nunca sobrescribe
      const path = await uploadReceipt(file)
      onChange(path)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(errorMessage(err))
    }
  }

  const hasFile = shownStatus === 'done' || preview !== null

  return (
    <div className="rounded-sm bg-white/50 p-4 ring-1 ring-gold-light/50">
      <p className="text-sm font-normal">Comprobante del adelanto</p>
      <p className="mt-1 text-xs text-ink/75">
        Captura de pantalla del Bizum o justificante de la transferencia (JPG, PNG, WEBP o PDF,
        máximo 5 MB).
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {preview?.kind === 'image' && (
          <img
            src={preview.url}
            alt="Vista previa del comprobante"
            className="size-20 rounded-sm object-cover ring-1 ring-gold-light"
          />
        )}
        {preview?.kind === 'pdf' && (
          <span
            aria-hidden="true"
            className="flex size-20 items-center justify-center rounded-sm bg-cream-dark text-xs font-semibold text-xmas-red ring-1 ring-gold-light"
          >
            PDF
          </span>
        )}

        <div className="min-w-0 flex-1">
          {preview && <p className="truncate text-sm">{preview.name}</p>}
          <p aria-live="polite" className="text-sm">
            {shownStatus === 'uploading' && 'Subiendo…'}
            {shownStatus === 'done' && <span className="text-pine">✓ Comprobante subido</span>}
          </p>
          {error && (
            <p role="alert" className="text-sm text-xmas-red">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Sin `capture`: así el móvil deja elegir una captura de la galería */}
      <label
        className={`mt-4 inline-flex cursor-pointer items-center has-focus-visible:outline-2 has-focus-visible:outline-gold-dark ${BUTTON_SECONDARY} ${
          shownStatus === 'uploading' ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        {hasFile ? 'Cambiar archivo' : 'Subir comprobante'}
        <input
          type="file"
          accept={RECEIPT_ACCEPT}
          disabled={shownStatus === 'uploading'}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            // Permite volver a elegir el mismo archivo
            e.target.value = ''
            if (file) void handleFile(file)
          }}
        />
      </label>
    </div>
  )
}
