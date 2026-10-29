import { useState } from 'react'
import AboutMe from '@/components/home/AboutMe'
import AdditionalInfo from '@/components/home/AdditionalInfo'
import ChristmasCarousel from '@/components/home/ChristmasCarousel'
import Espadilla from '@/components/home/Espadilla'
import Extras from '@/components/home/Extras'
import FinalCta from '@/components/home/FinalCta'
import Gallery from '@/components/home/Gallery'
import Hero from '@/components/home/Hero'
import PackagesSection from '@/components/home/PackagesSection'
import { usePublicProfile } from '@/lib/publicProfile'
import { usePublicSiteImages } from '@/lib/publicSiteImages'

type Props = {
  /** Inyectable para tests; por defecto, el momento actual. */
  now?: Date
}

export default function Home({ now: nowProp }: Props) {
  // Se fija al montar para que los precios no cambien entre renders
  const [now] = useState(() => nowProp ?? new Date())
  const profile = usePublicProfile()
  const siteImages = usePublicSiteImages()
  return (
    <>
      <Hero now={now} />
      <PackagesSection now={now} />
      <ChristmasCarousel images={siteImages.images.carousel} />
      <Gallery />
      <Espadilla siteImages={siteImages} />
      <Extras siteImages={siteImages} />
      <AdditionalInfo siteImages={siteImages} />
      <AboutMe profile={profile} />
      <FinalCta profile={profile} />
    </>
  )
}
