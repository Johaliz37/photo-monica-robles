import { useEffect } from 'react'
import { LEGAL_UPDATED, type LegalSection } from '@/content/legal'

type Props = {
  title: string
  intro?: React.ReactNode
  sections: LegalSection[]
}

export default function LegalPage({ title, intro, sections }: Props) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · Mónica Robles Fotografía`
    return () => {
      document.title = previous
    }
  }, [title])

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-dark sm:text-3xl sm:tracking-[0.25em]">
        {title}
      </h1>
      <div className="mx-auto mt-4 mb-10 h-px w-24 bg-gold-light" />

      {intro && <div className="mb-8 text-sm leading-relaxed">{intro}</div>}

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 font-display text-lg tracking-[0.12em] text-gold-dark">
              {section.title}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed">
              {section.paragraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.items && (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-gold">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 text-xs text-ink/70">Última actualización: {LEGAL_UPDATED}.</p>
    </article>
  )
}
