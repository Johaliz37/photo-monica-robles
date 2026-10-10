import LegalPage from '@/components/LegalPage'
import { LEGAL_NOTICE_SECTIONS } from '@/content/legal'

export default function Legal() {
  return <LegalPage title="Aviso legal" sections={LEGAL_NOTICE_SECTIONS} />
}
