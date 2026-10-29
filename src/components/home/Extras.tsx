import SectionTitle from '@/components/SectionTitle'
import SiteImage from '@/components/SiteImage'
import { EXTRAS } from '@/content/site'
import type { SiteImagesState } from '@/lib/publicSiteImages'
import { FIXED_SECTIONS } from '@/lib/siteImages'

function PhotosIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="size-8 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="6" y="12" width="22" height="26" rx="1" transform="rotate(-6 17 25)" />
      <rect x="18" y="8" width="22" height="26" rx="1" transform="rotate(10 29 21)" />
      <rect x="12" y="10" width="22" height="26" rx="1" fill="var(--color-cream)" />
      <circle cx="19" cy="18" r="2.5" />
      <circle cx="27" cy="18" r="2.5" />
      <path d="M15 30c0-4 2-6 4-6s4 2 4 6M23 30c0-4 2-6 4-6s4 2 4 6" />
    </svg>
  )
}

export default function Extras({ siteImages }: { siteImages: SiteImagesState }) {
  return (
    <section aria-labelledby="adicionales" className="bg-cream-dark/50 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <SectionTitle id="adicionales">Adicionales</SectionTitle>
        <div className="grid items-center gap-8 md:grid-cols-[2fr_3fr]">
          <SiteImage
            image={siteImages.images.extras}
            ready={siteImages.ready}
            fallback={FIXED_SECTIONS.extras.fallback}
            fallbackAlt={FIXED_SECTIONS.extras.fallbackAlt}
            sizes="(min-width: 1024px) 400px, (min-width: 768px) 40vw, 100vw"
            className="mx-auto aspect-[3/4] w-full max-w-sm rounded-sm object-cover"
          />
          <ul className="space-y-4">
            {EXTRAS.map((extra) => (
              <li
                key={extra.text}
                className="flex items-center gap-4 rounded-sm bg-cream p-4 shadow-sm sm:gap-6 sm:p-5"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-gold-light">
                  <PhotosIcon />
                </span>
                <p className="flex-1 text-sm tracking-wide">{extra.text}</p>
                <p className="shrink-0 border-l border-gold-light pl-4 font-display text-lg text-gold-dark sm:pl-6 sm:text-xl">
                  {extra.price}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
