import { Fragment } from 'react'
import Divider from '@/components/Divider'
import SectionTitle from '@/components/SectionTitle'
import SiteImage from '@/components/SiteImage'
import { INFO } from '@/content/site'
import type { SiteImagesState } from '@/lib/publicSiteImages'
import { FIXED_SECTIONS } from '@/lib/siteImages'

export default function AdditionalInfo({ siteImages }: { siteImages: SiteImagesState }) {
  return (
    <section aria-labelledby="informacion" className="px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <SectionTitle id="informacion" script="Adicional">
          Información
        </SectionTitle>
        <SiteImage
          image={siteImages.images.info}
          ready={siteImages.ready}
          fallback={FIXED_SECTIONS.info.fallback}
          fallbackAlt={FIXED_SECTIONS.info.fallbackAlt}
          sizes="(min-width: 672px) 672px, 100vw"
          className="mb-10 aspect-[3/2] w-full rounded-sm object-cover"
        />
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
