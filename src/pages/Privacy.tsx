import LegalPage from '@/components/LegalPage'
import { privacySections } from '@/content/legal'
import { usePublicProfile } from '@/lib/publicProfile'

export default function Privacy() {
  const profile = usePublicProfile()
  return (
    <LegalPage
      title="Política de privacidad"
      intro={
        <p>
          En esta página te explicamos qué datos personales recogemos al reservar una sesión, para
          qué los usamos y cómo puedes ejercer tus derechos, conforme al Reglamento General de
          Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
        </p>
      }
      sections={privacySections(profile)}
    />
  )
}
