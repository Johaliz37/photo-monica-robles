import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import {
  EMPTY_PROFILE_FORM,
  profileSchema,
  type ProfileFormData,
  type ProfileFormInput,
} from '@/components/admin/profileSchema'
import Spinner from '@/components/admin/Spinner'
import { BUTTON_PRIMARY } from '@/components/booking/Stepper'
import {
  deleteProfilePhoto,
  fetchProfile,
  PHOTO_ACCEPT,
  saveProfile,
  uploadProfilePhoto,
  type Profile,
} from '@/lib/adminApi'
import { formatDateTime } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import { profilePhotoUrl } from '@/lib/profile'
import { invalidatePublicProfile } from '@/lib/publicProfile'

const INPUT =
  'mt-1 block min-h-11 w-full rounded-sm bg-white px-3 py-2 text-base text-ink ring-1 ring-teal/30 placeholder:text-ink/40 focus:ring-2 focus:ring-teal focus:outline-none aria-invalid:ring-2 aria-invalid:ring-xmas-red'

const ABOUT_MAX = 3000

function toForm(p: Profile): ProfileFormInput {
  return {
    full_name: p.full_name,
    phone: p.phone,
    email: p.email,
    bizum: p.bizum,
    instagram: p.instagram,
    facebook: p.facebook,
    tiktok: p.tiktok,
    about: p.about,
    show_about: p.show_about,
    photo_path: p.photo_path,
  }
}

export default function AdminProfile() {
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  // Foto guardada en la BD: al cambiarla, la anterior se borra del bucket tras guardar
  const [savedPhoto, setSavedPhoto] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormInput, unknown, ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_PROFILE_FORM,
  })

  useEffect(() => {
    let cancelled = false
    fetchProfile()
      .then((p) => {
        if (cancelled) return
        if (p) {
          reset(toForm(p))
          setUpdatedAt(p.updated_at)
          setSavedPhoto(p.photo_path)
        }
        setLoaded(true)
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [reset])

  async function onSubmit(data: ProfileFormData) {
    setSaveError(null)
    setSaved(false)
    try {
      const p = await saveProfile(data)
      if (savedPhoto && savedPhoto !== p.photo_path) void deleteProfilePhoto(savedPhoto)
      reset(toForm(p))
      setUpdatedAt(p.updated_at)
      setSavedPhoto(p.photo_path)
      setSaved(true)
      invalidatePublicProfile()
    } catch (err) {
      setSaveError(errorMessage(err))
    }
  }

  // Sin esto, un error en un campo sin mensaje visible (show_about, photo_path) deja el botón mudo
  function onInvalid(invalid: FieldErrors<ProfileFormInput>) {
    setSaved(false)
    setSaveError(
      invalid.show_about || invalid.photo_path
        ? 'No se han podido leer todos los datos del perfil. Recarga la página; si sigue fallando, avisa al desarrollador.'
        : 'Revisa los campos marcados en rojo.',
    )
  }

  /** Cambia la foto del formulario; si la anterior aún no estaba guardada, la borra. */
  function replacePhoto(path: string) {
    const current = getValues('photo_path')
    if (current && current !== savedPhoto) void deleteProfilePhoto(current)
    setValue('photo_path', path, { shouldDirty: true })
  }

  async function onPhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    setPhotoError(null)
    setPhotoBusy(true)
    try {
      replacePhoto(await uploadProfilePhoto(file))
    } catch (err) {
      setPhotoError(errorMessage(err))
    } finally {
      setPhotoBusy(false)
    }
  }

  const field = (name: keyof ProfileFormInput) => ({
    id: `profile-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `profile-${name}-error` : `profile-${name}-hint`,
  })

  const fieldError = (name: keyof ProfileFormInput) =>
    errors[name] && (
      <p id={`profile-${name}-error`} className="mt-1 text-xs font-semibold text-xmas-red">
        {errors[name].message}
      </p>
    )

  const aboutLength = useWatch({ control, name: 'about' }).length
  const photoPath = useWatch({ control, name: 'photo_path' })
  const photoUrl = profilePhotoUrl(import.meta.env.VITE_SUPABASE_URL, photoPath)

  if (loadError) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <p role="alert" className="rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {loadError}
        </p>
      </section>
    )
  }
  if (!loaded) return <Spinner />

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <header className="relative mb-6 overflow-hidden rounded-sm bg-teal p-5 text-cream shadow-md sm:p-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 -right-2 text-8xl opacity-15 select-none"
        >
          ❄
        </span>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-leaf">Tus datos</p>
            <h1 className="mt-1 font-display text-2xl tracking-[0.2em]">Perfil</h1>
            <p className="mt-2 max-w-md text-sm text-cream/90">
              Lo que guardes aquí se muestra en la web: el Bizum en el pago de la reserva, los datos
              de contacto y redes en el pie, y «Sobre mí» en la página de inicio.
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
        {updatedAt && (
          <p className="relative mt-4 text-xs text-cream/80">
            Última actualización: {formatDateTime(updatedAt)}
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6">
        <Card title="Datos de contacto" icon="👤" accent="border-pine" titleClass="text-pine">
          <Field label="Nombre completo" hint="Aparece en «Sobre mí»." name="full_name">
            <input
              {...register('full_name')}
              {...field('full_name')}
              autoComplete="name"
              className={INPUT}
            />
          </Field>
          {fieldError('full_name')}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Field label="Teléfono" hint="Para llamadas y WhatsApp." name="phone">
                <input
                  {...register('phone')}
                  {...field('phone')}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+34 600 00 00 00"
                  className={INPUT}
                />
              </Field>
              {fieldError('phone')}
            </div>
            <div>
              <Field label="Correo electrónico" hint="Email de contacto público." name="email">
                <input
                  {...register('email')}
                  {...field('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="hola@ejemplo.com"
                  className={INPUT}
                />
              </Field>
              {fieldError('email')}
            </div>
          </div>
        </Card>

        <Card
          title="Pago del adelanto"
          icon="💶"
          accent="border-honey"
          titleClass="text-honey-dark"
        >
          <Field
            label="Número de Bizum"
            hint="Se muestra al cliente en el último paso de la reserva para pagar el adelanto."
            name="bizum"
          >
            <input
              {...register('bizum')}
              {...field('bizum')}
              type="tel"
              inputMode="tel"
              placeholder="600 00 00 00"
              className={INPUT}
            />
          </Field>
          {fieldError('bizum')}
        </Card>

        <Card title="Redes sociales" icon="📱" accent="border-teal" titleClass="text-teal">
          <p className="text-xs text-ink/70">
            Escribe tu usuario o pega el enlace de tu perfil: se guarda solo el usuario.
          </p>
          {(
            [
              ['instagram', 'Instagram', 'instagram.com/'],
              ['facebook', 'Facebook', 'facebook.com/'],
              ['tiktok', 'TikTok', 'tiktok.com/@'],
            ] as const
          ).map(([name, label, prefix]) => (
            <div key={name}>
              <label htmlFor={`profile-${name}`} className="text-sm font-semibold">
                {label}
              </label>
              <div className="mt-1 flex rounded-sm ring-1 ring-teal/30 focus-within:ring-2 focus-within:ring-teal has-aria-invalid:ring-2 has-aria-invalid:ring-xmas-red">
                <span className="flex items-center rounded-l-sm bg-teal/10 px-3 text-sm text-teal">
                  {prefix}
                </span>
                <input
                  {...register(name)}
                  {...field(name)}
                  autoComplete="off"
                  spellCheck={false}
                  className="block min-h-11 w-full min-w-0 rounded-r-sm bg-white px-3 text-base text-ink focus:outline-none"
                />
              </div>
              <span id={`profile-${name}-hint`} hidden />
              {fieldError(name)}
            </div>
          ))}
        </Card>

        <Card title="Sobre mí" icon="📸" accent="border-xmas-red" titleClass="text-xmas-red">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm bg-cream/60 px-3 py-2 ring-1 ring-gold-light/40">
            <input
              type="checkbox"
              {...register('show_about')}
              className="size-5 shrink-0 accent-pine"
            />
            <span className="text-sm">
              <span className="font-semibold">Mostrar «Sobre mí» en la página de inicio</span>
              <span className="block text-xs text-ink/60">
                Si lo desactivas, el texto y la foto se guardan pero no se publican.
              </span>
            </span>
          </label>

          <div>
            <p className="text-sm font-semibold">Foto de perfil</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-dark ring-2 ring-gold-light">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto de perfil" className="size-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="text-3xl opacity-50">
                    👤
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-teal px-4 text-sm text-cream transition hover:bg-pine has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-dark has-disabled:cursor-wait has-disabled:opacity-60">
                  {photoBusy ? 'Subiendo…' : photoUrl ? 'Cambiar foto' : 'Subir foto'}
                  <input
                    type="file"
                    accept={PHOTO_ACCEPT}
                    onChange={onPhotoChange}
                    disabled={photoBusy}
                    className="sr-only"
                  />
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => replacePhoto('')}
                    disabled={photoBusy}
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-sm text-xmas-red ring-1 ring-xmas-red/40 transition hover:bg-xmas-red/10"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-ink/60">
              JPG, PNG o WEBP. Se recorta en cuadrado al centro y se muestra redonda.
            </p>
            {photoError && (
              <p role="alert" className="mt-1 text-xs font-semibold text-xmas-red">
                {photoError}
              </p>
            )}
          </div>

          <Field
            label="Texto de presentación"
            hint="Se muestra en la página de inicio. Los saltos de línea se respetan."
            name="about"
          >
            <textarea
              {...register('about')}
              {...field('about')}
              rows={8}
              maxLength={ABOUT_MAX}
              placeholder="Cuéntales quién eres y cómo son tus sesiones…"
              className={`${INPUT} leading-relaxed`}
            />
          </Field>
          <p
            className={`text-right text-xs tabular-nums ${aboutLength > ABOUT_MAX * 0.9 ? 'text-xmas-red' : 'text-ink/60'}`}
          >
            {aboutLength} / {ABOUT_MAX}
          </p>
          {fieldError('about')}
        </Card>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-gold-light/40 bg-cream/95 px-4 py-3 backdrop-blur-sm">
          <p aria-live="polite" className="mr-auto text-sm">
            {saveError ? (
              <span role="alert" className="font-semibold text-xmas-red">
                {saveError}
              </span>
            ) : saved && !isDirty ? (
              <span className="font-semibold text-pine">✓ Perfil guardado</span>
            ) : isDirty ? (
              <span className="text-honey-dark">Tienes cambios sin guardar</span>
            ) : null}
          </p>
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className={BUTTON_PRIMARY.replaceAll('bg-gold-dark', 'bg-pine').replace(
              'hover:bg-ink',
              'hover:bg-teal',
            )}
          >
            {isSubmitting ? 'Guardando…' : 'Guardar perfil'}
          </button>
        </div>
      </form>
    </section>
  )
}

type CardProps = {
  title: string
  icon: string
  /** Color de la franja superior (clase border-*). */
  accent: string
  titleClass: string
  children: ReactNode
}

function Card({ title, icon, accent, titleClass, children }: CardProps) {
  return (
    <fieldset
      className={`space-y-4 rounded-sm border-t-4 bg-white/80 p-5 shadow-sm ring-1 ring-gold-light/40 ${accent}`}
    >
      <legend className="sr-only">{title}</legend>
      <h2
        aria-hidden="true"
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${titleClass}`}
      >
        <span className="text-base">{icon}</span>
        {title}
      </h2>
      {children}
    </fieldset>
  )
}

function Field({
  label,
  hint,
  name,
  children,
}: {
  label: string
  hint: string
  name: keyof ProfileFormInput
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={`profile-${name}`} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      <p id={`profile-${name}-hint`} className="mt-1 text-xs text-ink/60">
        {hint}
      </p>
    </div>
  )
}
