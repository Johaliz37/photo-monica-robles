import { useEffect, useState } from 'react'
import { receiptUrl } from '@/lib/adminApi'

type State = { path: string; url: string | null; error: boolean }

export default function ReceiptViewer({ path }: { path: string }) {
  const [state, setState] = useState<State>({ path, url: null, error: false })
  const [zoomed, setZoomed] = useState(false)
  const isPdf = path.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    let cancelled = false
    receiptUrl(path)
      .then((url) => !cancelled && setState({ path, url, error: false }))
      .catch(() => !cancelled && setState({ path, url: null, error: true }))
    return () => {
      cancelled = true
    }
  }, [path])

  const current = state.path === path ? state : { url: null, error: false }

  if (current.error) {
    return (
      <p role="alert" className="text-sm text-xmas-red">
        No se ha podido cargar el comprobante.
      </p>
    )
  }
  if (!current.url) {
    return (
      <p role="status" className="text-sm">
        Cargando comprobante…
      </p>
    )
  }

  const openLink = (
    <a
      href={current.url}
      target="_blank"
      rel="noreferrer"
      className="inline-block py-2 text-sm text-gold-dark underline underline-offset-4"
    >
      Abrir en pestaña nueva
    </a>
  )

  if (isPdf) {
    return (
      <div className="space-y-2">
        <object
          data={current.url}
          type="application/pdf"
          aria-label="Comprobante en PDF"
          className="h-[32rem] w-full rounded-sm ring-1 ring-gold-light/50"
        >
          <p className="p-4 text-sm">Este navegador no puede mostrar el PDF aquí.</p>
        </object>
        {openLink}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setZoomed((z) => !z)}
        aria-pressed={zoomed}
        aria-label={zoomed ? 'Reducir comprobante' : 'Ampliar comprobante'}
        className={`block w-full overflow-auto rounded-sm bg-white ring-1 ring-gold-light/50 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
      >
        <img
          src={current.url}
          alt="Comprobante del adelanto"
          className={zoomed ? 'w-full max-w-none' : 'mx-auto max-h-[28rem] object-contain'}
        />
      </button>
      {openLink}
    </div>
  )
}
