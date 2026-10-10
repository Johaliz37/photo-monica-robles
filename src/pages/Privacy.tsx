import LegalPage from '@/components/LegalPage'
import { PRIVACY_SECTIONS } from '@/content/legal'

export default function Privacy() {
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
      sections={PRIVACY_SECTIONS}
    />
  )
}
