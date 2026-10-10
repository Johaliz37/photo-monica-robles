import { PACKAGES, type Package, type PackageCode } from '@/content/packages'
import { BABY_EXTENSION_HELP, BOOKING } from '@/content/site'
import { formatEUR, formatEURCompact } from '@/lib/money'
import { bookingTotal, packagePrice } from '@/lib/pricing'
import { PACKAGE_THEME } from '../packageTheme'
import { StepNav } from './Stepper'

type Props = {
  pkg: Package | undefined
  baby: boolean
  now: Date
  onPackage: (code: PackageCode) => void
  onBaby: (baby: boolean) => void
  onNext: () => void
}

export default function StepPackage({ pkg, baby, now, onPackage, onBaby, onNext }: Props) {
  return (
    <div>
      <StepNav
        onNext={onNext}
        nextDisabled={!pkg}
        hint={pkg ? undefined : 'Elige un paquete para continuar.'}
      />
      <fieldset>
        <legend className="sr-only">Paquete</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACKAGES.map((p) => {
            const price = packagePrice(p, now)
            const checked = pkg?.code === p.code
            const theme = PACKAGE_THEME[p.code]
            return (
              <label
                key={p.code}
                className={`flex cursor-pointer flex-col rounded-sm border-t-4 bg-white/50 p-4 ring-1 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-dark ${theme.border} ${
                  checked ? `ring-2 ${theme.ringStrong}` : `${theme.ring} hover:ring-gold`
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="package"
                    value={p.code}
                    checked={checked}
                    onChange={() => onPackage(p.code)}
                    className="size-4 accent-gold-dark"
                  />
                  <span className="flex flex-col">
                    <span className="font-display tracking-[0.15em] text-gold-dark">
                      Paquete {p.number}
                    </span>
                    <span className={`font-script text-xl ${theme.text}`}>{p.name}</span>
                  </span>
                </span>
                <span className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-sm">{p.durationMin} min</span>
                  <span className="text-right">
                    {price.original !== undefined && (
                      <span className="mr-2 text-sm text-ink/60 line-through decoration-xmas-red">
                        <span className="sr-only">Antes </span>
                        {formatEURCompact(price.original)}
                      </span>
                    )}
                    <span className="font-display text-xl font-semibold text-gold-dark">
                      {formatEURCompact(price.current)}
                    </span>
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-6 rounded-sm bg-white/50 p-4 ring-1 ring-gold-light/50">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={baby}
            onChange={(e) => onBaby(e.target.checked)}
            aria-describedby="baby-help"
            className="size-5 shrink-0 accent-gold-dark"
          />
          <span className="text-sm font-normal">
            Ampliación de tiempo para bebé (+{formatEURCompact(BOOKING.babyExtraCents)})
          </span>
        </label>
        <p id="baby-help" className="mt-1 pl-8 text-xs text-ink/75">
          {BABY_EXTENSION_HELP} La ampliación suma {BOOKING.babyExtraMin} min a la sesión.
        </p>
      </div>

      {pkg && (
        <p className="mt-6 text-center text-sm" aria-live="polite">
          Duración total:{' '}
          <strong className="font-semibold">
            {pkg.durationMin + (baby ? BOOKING.babyExtraMin : 0)} min
          </strong>{' '}
          · Precio total:{' '}
          <strong className="font-semibold">{formatEUR(bookingTotal(pkg, baby, now))}</strong>
        </p>
      )}
    </div>
  )
}
