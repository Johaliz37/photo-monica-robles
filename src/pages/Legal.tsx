import LegalPage from '@/components/LegalPage'
import { legalNoticeSections } from '@/content/legal'
import { usePublicProfile } from '@/lib/publicProfile'

export default function Legal() {
  const profile = usePublicProfile()
  return <LegalPage title="Aviso legal" sections={legalNoticeSections(profile)} />
}
