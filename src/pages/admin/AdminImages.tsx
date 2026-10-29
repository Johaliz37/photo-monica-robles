import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Spinner from '@/components/admin/Spinner'
import ResponsiveImage from '@/components/ResponsiveImage'
import { CAROUSEL } from '@/content/site'
import {
  addCarouselImage,
  deleteSiteImage,
  fetchSiteImages,
  PHOTO_ACCEPT,
  reorderCarousel,
  setFixedSiteImage,
  updateSiteImageAlt,
  type SiteImageRow,
} from '@/lib/adminApi'
import { errorMessage } from '@/lib/errors'
import { invalidatePublicSiteImages } from '@/lib/publicSiteImages'
import {
  FIXED_SECTION_KEYS,
  FIXED_SECTIONS,
  moveItem,
  siteImageUrl,
  type FixedSection,
} from '@/lib/siteImages'

const INPUT =
  'block min-h-11 w-full min-w-0 rounded-sm bg-white px-3 py-2 text-base text-ink ring-1 ring-teal/30 placeholder:text-ink/40 focus:ring-2 focus:ring-teal focus:outline-none'
const UPLOAD_BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center rounded-full bg-teal px-4 text-sm text-cream transition hover:bg-pine has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-dark has-disabled:cursor-wait has-disabled:opacity-60'
const DELETE_BUTTON =
  'inline-flex min-h-11 items-center rounded-full px-4 text-sm text-xmas-red ring-1 ring-xmas-red/40 transition hover:bg-xmas-red/10 disabled:opacity-50'
const ICON_BUTTON =
  'flex size-11 items-center justify-center rounded-full bg-white text-lg text-teal ring-1 ring-teal/30 transition hover:bg-teal hover:text-cream disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-teal'
const ALT_MAX = 200

const publicUrl = (path: string) => siteImageUrl(import.meta.env.VITE_SUPABASE_URL, path)

export default function AdminImages() {
  const [rows, setRows] = useState<SiteImageRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Sección fija que está subiendo foto
  const [busySection, setBusySection] = useState<FixedSection | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [toDelete, setToDelete] = useState<SiteImageRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSiteImages()
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setLoadError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [])

  if (loadError) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <p role="alert" className="rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {loadError}
        </p>
      </section>
    )
  }
  if (!rows) return <Spinner />

  const carousel = rows.filter((r) => r.section === 'carousel')
  const fixed = (section: FixedSection) => rows.find((r) => r.section === section)

  function changed(next: SiteImageRow[]) {
    setRows(next)
    invalidatePublicSiteImages()
  }

  async function onFixedChange(section: FixedSection, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file || !rows) return
    setError(null)
    setBusySection(section)
    try {
      const saved = await setFixedSiteImage(section, file, fixed(section)?.alt ?? '')
      changed([...rows.filter((r) => r.section !== section), saved])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusySection(null)
    }
  }

  async function onCarouselAdd(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0 || !rows) return
    setError(null)
    let next = rows
    let order = Math.max(0, ...carousel.map((r) => r.sort_order))
    const failed: string[] = []
    for (const [i, file] of files.entries()) {
      setUploadProgress({ done: i, total: files.length })
      try {
        const saved = await addCarouselImage(file, ++order)
        next = [...next, saved]
        changed(next)
      } catch (err) {
        failed.push(`${file.name}: ${errorMessage(err)}`)
      }
    }
    setUploadProgress(null)
    if (failed.length > 0) {
      setError(
        `${failed.length === 1 ? 'Una foto no se ha' : `${failed.length} fotos no se han`} podido subir. ${failed.join(' ')}`,
      )
    }
  }

  async function onMove(index: number, delta: number) {
    if (!rows) return
    const before = rows
    const ordered = moveItem(carousel, index, delta).map((r, i) => ({ ...r, sort_order: i + 1 }))
    setError(null)
    changed([...rows.filter((r) => r.section !== 'carousel'), ...ordered])
    try {
      await reorderCarousel(ordered.map((r) => r.id))
    } catch (err) {
      setRows(before)
      setError(errorMessage(err))
    }
  }

  function onAltSaved(id: string, alt: string) {
    if (rows) changed(rows.map((r) => (r.id === id ? { ...r, alt } : r)))
  }

  async function confirmDelete() {
    if (!toDelete || !rows) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSiteImage(toDelete)
      changed(rows.filter((r) => r.id !== toDelete.id))
      setToDelete(null)
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const deletingFixed = toDelete && toDelete.section !== 'carousel'

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <header className="relative mb-6 overflow-hidden rounded-sm bg-teal p-5 text-cream shadow-md sm:p-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 -right-2 text-8xl opacity-15 select-none"
        >
          ✦
        </span>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-leaf">Página de inicio</p>
            <h1 className="mt-1 font-display text-2xl tracking-[0.2em]">Imágenes</h1>
            <p className="mt-2 max-w-md text-sm text-cream/90">
              Cambia las fotos de algunas secciones y gestiona el carrusel «{CAROUSEL.title}{' '}
              {CAROUSEL.script}». Los cambios se ven en la web al momento.
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-cream/10 px-4 text-sm ring-1 ring-cream/40 transition hover:bg-cream/20"
          >
            Ver la web ↗
          </a>
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {error}
        </p>
      )}

      <Card title="Fotos de las secciones" icon="🖼️" accent="border-honey">
        <p className="text-xs text-ink/70">
          Una foto por sección. Si quitas la tuya, vuelve a verse la foto por defecto.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {FIXED_SECTION_KEYS.map((section) => {
            const info = FIXED_SECTIONS[section]
            const image = fixed(section)
            const url = image && publicUrl(image.path)
            const busy = busySection === section
            return (
              <article
                key={section}
                aria-labelledby={`section-${section}`}
                className="flex flex-col gap-3 rounded-sm bg-cream/60 p-3 ring-1 ring-gold-light/40"
              >
                <div className="relative">
                  {url ? (
                    <img
                      src={url}
                      alt={image.alt}
                      className="aspect-[4/3] w-full rounded-sm object-cover"
                    />
                  ) : (
                    <ResponsiveImage
                      name={info.fallback}
                      alt={info.fallbackAlt}
                      sizes="(min-width: 768px) 300px, 100vw"
                      className="aspect-[4/3] w-full rounded-sm object-cover"
                    />
                  )}
                  <span
                    className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold ${url ? 'bg-pine text-cream' : 'bg-cream/90 text-ink'}`}
                  >
                    {url ? 'Tu foto' : 'Foto por defecto'}
                  </span>
                </div>
                <div>
                  <h3 id={`section-${section}`} className="font-semibold">
                    {info.label}
                  </h3>
                  <p className="text-xs text-ink/60">{info.where}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className={UPLOAD_BUTTON}>
                    {busy ? 'Subiendo…' : url ? 'Cambiar foto' : 'Subir foto'}
                    <input
                      type="file"
                      accept={PHOTO_ACCEPT}
                      onChange={(e) => void onFixedChange(section, e)}
                      disabled={busySection !== null}
                      className="sr-only"
                    />
                  </label>
                  {image && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null)
                        setToDelete(image)
                      }}
                      disabled={busy}
                      className={DELETE_BUTTON}
                    >
                      Quitar
                    </button>
                  )}
                </div>
                {image && <AltEditor key={image.id} image={image} onSaved={onAltSaved} />}
              </article>
            )
          })}
        </div>
      </Card>

      <div className="mt-6">
        <Card
          title={`Carrusel «${CAROUSEL.title} ${CAROUSEL.script}»`}
          icon="🎄"
          accent="border-pine"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink/70">
              Se muestra después de los paquetes. Si no hay fotos, la sección no aparece. Puedes
              elegir varias fotos a la vez.
            </p>
            <label className={UPLOAD_BUTTON}>
              {uploadProgress
                ? `Subiendo ${uploadProgress.done + 1} de ${uploadProgress.total}…`
                : '+ Añadir fotos'}
              <input
                type="file"
                accept={PHOTO_ACCEPT}
                multiple
                onChange={(e) => void onCarouselAdd(e)}
                disabled={uploadProgress !== null}
                className="sr-only"
              />
            </label>
          </div>

          {carousel.length === 0 ? (
            <p className="rounded-sm bg-cream/60 p-6 text-center text-sm text-ink/70">
              Todavía no hay fotos en el carrusel.
            </p>
          ) : (
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {carousel.map((image, i) => {
                const url = publicUrl(image.path)
                return (
                  <li
                    key={image.id}
                    className="flex flex-col gap-3 rounded-sm bg-cream/60 p-3 ring-1 ring-gold-light/40"
                  >
                    <div className="relative">
                      {url && (
                        <img
                          src={url}
                          alt={image.alt}
                          loading="lazy"
                          className="aspect-[4/5] w-full rounded-sm object-cover"
                        />
                      )}
                      <span className="absolute top-2 left-2 flex size-8 items-center justify-center rounded-full bg-pine text-sm font-semibold text-cream">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void onMove(i, -1)}
                        disabled={i === 0}
                        aria-label={`Mover la foto ${i + 1} antes`}
                        className={ICON_BUTTON}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => void onMove(i, 1)}
                        disabled={i === carousel.length - 1}
                        aria-label={`Mover la foto ${i + 1} después`}
                        className={ICON_BUTTON}
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setToDelete(image)
                        }}
                        className={`ml-auto ${DELETE_BUTTON}`}
                      >
                        Borrar
                      </button>
                    </div>
                    <AltEditor image={image} onSaved={onAltSaved} />
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={deletingFixed ? 'Quitar la foto' : 'Borrar la foto del carrusel'}
        confirmLabel={deletingFixed ? 'Quitar' : 'Borrar'}
        tone="danger"
        busy={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && publicUrl(toDelete.path) && (
          <img
            src={publicUrl(toDelete.path) ?? undefined}
            alt=""
            className="mx-auto max-h-48 rounded-sm object-contain"
          />
        )}
        <p>
          {deletingFixed
            ? `La sección «${FIXED_SECTIONS[toDelete.section as FixedSection].label}» volverá a mostrar la foto por defecto.`
            : 'La foto se borrará y dejará de verse en el carrusel. No se puede deshacer.'}
        </p>
      </ConfirmDialog>
    </section>
  )
}

/** Descripción de la foto (texto alternativo para lectores de pantalla y buscadores). */
function AltEditor({
  image,
  onSaved,
}: {
  image: SiteImageRow
  onSaved: (id: string, alt: string) => void
}) {
  const [value, setValue] = useState(image.alt)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>('idle')
  const dirty = value.trim() !== image.alt

  async function save() {
    setSaving(true)
    setStatus('idle')
    try {
      const alt = value.trim()
      await updateSiteImageAlt(image.id, alt)
      onSaved(image.id, alt)
      setValue(alt)
      setStatus('saved')
    } catch (err) {
      setStatus(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const id = `alt-${image.id}`
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold">
        Descripción de la foto
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          value={value}
          maxLength={ALT_MAX}
          onChange={(e) => {
            setValue(e.target.value)
            setStatus('idle')
          }}
          placeholder="Ej.: Hermanos abrazados junto al árbol"
          className={INPUT}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="min-h-11 shrink-0 rounded-full bg-pine px-4 text-sm text-cream transition hover:bg-teal disabled:opacity-40 disabled:hover:bg-pine"
        >
          {saving ? '…' : 'Guardar'}
        </button>
      </div>
      <p aria-live="polite" className="mt-1 text-xs">
        {status === 'saved' ? (
          <span className="font-semibold text-pine">✓ Guardada</span>
        ) : status !== 'idle' ? (
          <span role="alert" className="font-semibold text-xmas-red">
            {status}
          </span>
        ) : (
          <span className="text-ink/60">Ayuda a quien no puede ver la imagen.</span>
        )}
      </p>
    </div>
  )
}

function Card({
  title,
  icon,
  accent,
  children,
}: {
  title: string
  icon: string
  /** Color de la franja superior (clase border-*). */
  accent: string
  children: ReactNode
}) {
  return (
    <div
      className={`space-y-4 rounded-sm border-t-4 bg-white/80 p-5 shadow-sm ring-1 ring-gold-light/40 ${accent}`}
    >
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
        <span aria-hidden="true" className="text-base">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  )
}
