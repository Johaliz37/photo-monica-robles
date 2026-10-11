import { useSearchParams } from 'react-router-dom'
import { ADMIN_MANUAL, CLIENT_MANUAL, type Manual } from '@/content/manual'

const TABS: { value: string; label: string; manual: Manual }[] = [
  { value: 'admin', label: 'Administración', manual: ADMIN_MANUAL },
  { value: 'clientes', label: 'Clientes', manual: CLIENT_MANUAL },
]

/** Manual de usuario de las dos vistas: la pública (clientes) y el panel de administración. */
export default function AdminManual() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.find((t) => t.value === searchParams.get('vista')) ?? TABS[0]
  const { manual } = tab

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <header className="relative mb-6 overflow-hidden rounded-sm bg-teal p-5 text-cream shadow-md sm:p-6 print:hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 -right-2 text-8xl opacity-15 select-none"
        >
          ❄
        </span>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-leaf">Ayuda</p>
            <h1 className="mt-1 font-display text-2xl tracking-[0.2em]">Manual de usuario</h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-11 rounded-full bg-cream/10 px-4 text-sm ring-1 ring-cream/40 transition hover:bg-cream/20"
          >
            Imprimir
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Manual" className="mb-6 flex flex-wrap gap-2 print:hidden">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={t.value === tab.value}
            onClick={() => setSearchParams(t === TABS[0] ? {} : { vista: t.value }, { replace: true })}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ring-1 transition ${
              t.value === tab.value
                ? 'bg-teal text-cream ring-teal shadow-md'
                : 'bg-teal/10 text-teal ring-teal/30 hover:bg-teal/20'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <article role="tabpanel" aria-label={manual.title}>
        <h2 className="font-display text-xl tracking-[0.12em] text-gold-dark">{manual.title}</h2>
        <p className="mt-2 text-sm leading-relaxed">{manual.intro}</p>

        <nav
          aria-label="Índice"
          className="mt-6 rounded-sm border-t-4 border-gold-light bg-white/80 p-5 shadow-sm ring-1 ring-gold-light/40"
        >
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Índice
          </h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm marker:text-gold-dark">
            {manual.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-teal underline-offset-4 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 space-y-8">
          {manual.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-4">
              <h3 className="mb-3 font-display text-lg tracking-[0.12em] text-gold-dark">{s.title}</h3>
              <div className="space-y-3 text-sm leading-relaxed">
                {s.paragraphs?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {s.steps && (
                  <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-teal">
                    {s.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                )}
                {s.items && (
                  <ul className="list-disc space-y-1.5 pl-5 marker:text-gold">
                    {s.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {s.tip && (
                  <p className="flex gap-2 rounded-sm bg-honey/15 px-3 py-2 ring-1 ring-honey/40">
                    <span aria-hidden="true">💡</span>
                    <span>{s.tip}</span>
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    </section>
  )
}
