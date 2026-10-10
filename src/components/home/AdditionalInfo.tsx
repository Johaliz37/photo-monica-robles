import { Fragment } from 'react'
import Divider from '@/components/Divider'
import SectionTitle from '@/components/SectionTitle'
import { INFO } from '@/content/site'

export default function AdditionalInfo() {
  return (
    <section aria-labelledby="informacion" className="px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <SectionTitle id="informacion" script="Adicional">
          Información
        </SectionTitle>
        {INFO.map((block, i) => (
          <Fragment key={block.title}>
            {i > 0 && <Divider className="my-8" />}
            <div className="flex gap-4">
              <span aria-hidden="true" className="text-xl text-gold">
                ✦
              </span>
              <p className="text-sm leading-relaxed tracking-wide sm:text-base">
                <strong className="font-display font-semibold tracking-[0.1em] text-gold-dark">
                  {block.title}:
                </strong>{' '}
                {block.text}
              </p>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
}
