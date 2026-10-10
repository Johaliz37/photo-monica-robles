import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { clientSchema, type ClientData } from './clientSchema'
import { StepNav } from './Stepper'

const INPUT =
  'mt-1 w-full rounded-sm border border-gold-light bg-white/70 px-3 py-2.5 text-base text-ink placeholder:text-ink/40 aria-invalid:border-xmas-red'

type Props = {
  defaultValues: ClientData
  onSubmit: (client: ClientData) => void
  /** Recibe los valores actuales (sin validar) para no perderlos al volver atrás. */
  onBack: (draft: ClientData) => void
}

export default function StepClient({ defaultValues, onSubmit, onBack }: Props) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(clientSchema), defaultValues })

  const field = (name: keyof ClientData) => ({
    id: `client-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `client-${name}-error` : undefined,
  })

  const error = (name: keyof ClientData) =>
    errors[name] && (
      <p id={`client-${name}-error`} className="mt-1 text-xs text-xmas-red">
        {errors[name].message}
      </p>
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <StepNav onBack={() => onBack(getValues())} />
      <div>
        <label htmlFor="client-name" className="text-sm font-normal">
          Nombre y apellidos
        </label>
        <input {...register('name')} {...field('name')} autoComplete="name" className={INPUT} />
        {error('name')}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="client-email" className="text-sm font-normal">
            Email
          </label>
          <input
            {...register('email')}
            {...field('email')}
            type="email"
            autoComplete="email"
            className={INPUT}
          />
          {error('email')}
        </div>
        <div>
          <label htmlFor="client-phone" className="text-sm font-normal">
            Teléfono
          </label>
          <input
            {...register('phone')}
            {...field('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={INPUT}
          />
          {error('phone')}
        </div>
      </div>

      <div>
        <label htmlFor="client-participants" className="text-sm font-normal">
          Participantes
        </label>
        <input
          {...register('participants')}
          {...field('participants')}
          placeholder="Nº de niños/adultos y edades"
          className={INPUT}
        />
        {error('participants')}
      </div>

      <div>
        <label htmlFor="client-notes" className="text-sm font-normal">
          Notas <span className="text-ink/60">(opcional)</span>
        </label>
        <textarea {...register('notes')} {...field('notes')} rows={3} className={INPUT} />
        {error('notes')}
      </div>

      <div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            {...register('consent')}
            {...field('consent')}
            className="size-5 shrink-0 accent-gold-dark"
          />
          <span>
            He leído y acepto la{' '}
            <a
              href="/privacidad"
              target="_blank"
              rel="noreferrer"
              className="font-normal text-gold-dark underline"
            >
              política de privacidad
            </a>
          </span>
        </label>
        {error('consent')}
      </div>
    </form>
  )
}
