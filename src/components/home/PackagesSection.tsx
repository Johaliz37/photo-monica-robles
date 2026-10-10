import PackageCard from '@/components/PackageCard'
import SectionTitle from '@/components/SectionTitle'
import { PACKAGES } from '@/content/packages'

type Props = {
  now: Date
}

export default function PackagesSection({ now }: Props) {
  return (
    <section aria-labelledby="paquetes" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionTitle id="paquetes">Paquetes</SectionTitle>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <PackageCard key={pkg.code} pkg={pkg} now={now} />
          ))}
        </div>
      </div>
    </section>
  )
}
