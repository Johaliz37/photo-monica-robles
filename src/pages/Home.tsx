import { useState } from 'react'
import AdditionalInfo from '@/components/home/AdditionalInfo'
import Espadilla from '@/components/home/Espadilla'
import Extras from '@/components/home/Extras'
import FinalCta from '@/components/home/FinalCta'
import Gallery from '@/components/home/Gallery'
import Hero from '@/components/home/Hero'
import PackagesSection from '@/components/home/PackagesSection'

type Props = {
  /** Inyectable para tests; por defecto, el momento actual. */
  now?: Date
}

export default function Home({ now: nowProp }: Props) {
  // Se fija al montar para que los precios no cambien entre renders
  const [now] = useState(() => nowProp ?? new Date())
  return (
    <>
      <Hero now={now} />
      <PackagesSection now={now} />
      <Gallery />
      <Espadilla />
      <Extras />
      <AdditionalInfo />
      <FinalCta />
    </>
  )
}
