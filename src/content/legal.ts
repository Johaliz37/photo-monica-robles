import { CONTACT } from './site'

/**
 * Datos del titular de la web (responsable del tratamiento).
 * TODO: pendiente de Mónica (nombre completo, NIF, email y, si procede, dirección).
 * Mientras valgan 'TODO', las páginas legales muestran "[pendiente]".
 */
export const OWNER = {
  name: 'TODO',
  nif: 'TODO',
  email: 'TODO',
  /** Opcional: déjalo vacío si no se quiere publicar. */
  address: '',
  brand: 'Mónica Robles Fotografía',
} as const

/** Fecha de la última revisión de los textos legales. */
export const LEGAL_UPDATED = '10 de octubre de 2026'

export const isPending = (value: string) => value.trim() === '' || value === 'TODO'

export interface LegalSection {
  title: string
  /** Párrafos. */
  paragraphs?: string[]
  /** Lista de viñetas tras los párrafos. */
  items?: string[]
}

const owner = (value: string) => (isPending(value) ? '[pendiente]' : value)

const contactLine =
  `Email: ${owner(OWNER.email)}. Instagram: @${CONTACT.instagram}.` +
  (OWNER.address ? ` Dirección: ${OWNER.address}.` : '')

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Responsable del tratamiento',
    items: [
      `Titular: ${owner(OWNER.name)} (${OWNER.brand}).`,
      `NIF: ${owner(OWNER.nif)}.`,
      contactLine,
    ],
  },
  {
    title: 'Qué datos tratamos',
    paragraphs: ['Cuando reservas una sesión a través del formulario recogemos:'],
    items: [
      'Datos de contacto: nombre y apellidos, email y teléfono.',
      'Información de la sesión: paquete, fecha y hora, número de participantes y sus edades (que pueden ser de menores) y las notas que quieras añadir.',
      'El comprobante del pago del adelanto (captura del Bizum o justificante de la transferencia), que puede contener datos bancarios parciales.',
      'La fecha y hora en que aceptas esta política.',
    ],
  },
  {
    title: 'Para qué los usamos',
    paragraphs: [
      'Para gestionar la reserva de tu sesión fotográfica: comprobar el pago del adelanto, confirmar o rechazar la reserva y contactar contigo para organizar la sesión y la entrega de las fotos. No se usan para enviar publicidad ni se toman decisiones automatizadas.',
    ],
  },
  {
    title: 'Base legal',
    paragraphs: [
      'La ejecución de un contrato o de medidas precontractuales a petición tuya (art. 6.1.b del RGPD), ya que los datos son necesarios para reservar y realizar la sesión, y tu consentimiento (art. 6.1.a del RGPD), que prestas al marcar la casilla del formulario y que puedes retirar en cualquier momento.',
    ],
  },
  {
    title: 'Menores de edad',
    paragraphs: [
      'Los datos de los menores que participan en la sesión (por ejemplo, su edad) los facilita su padre, madre o tutor legal, que es quien hace la reserva y presta el consentimiento en su nombre.',
    ],
  },
  {
    title: 'Cuánto tiempo los conservamos',
    items: [
      'Los comprobantes de pago se eliminan a los 6 meses de la sesión.',
      'El resto de los datos de la reserva se conservan durante 12 meses tras la sesión y después se eliminan, salvo que una obligación legal (por ejemplo, fiscal) exija conservarlos más tiempo.',
      'Si la reserva se rechaza, los datos se eliminan en los mismos plazos.',
    ],
  },
  {
    title: 'Quién más tiene acceso',
    paragraphs: [
      'No cedemos tus datos a terceros. Para que la web funcione nos apoyamos en estos proveedores, que actúan como encargados del tratamiento:',
    ],
    items: [
      'Supabase: base de datos y almacenamiento de los comprobantes, alojados en la Unión Europea (Fráncfort, Alemania).',
      'Cloudflare: alojamiento y entrega de la web.',
    ],
  },
  {
    title: 'Transferencias internacionales',
    paragraphs: [
      'Ambos proveedores son empresas con sede en Estados Unidos. Los datos de las reservas se almacenan en la UE, y cualquier acceso desde fuera de ella está amparado por el Marco de Privacidad de Datos UE-EE. UU. y por cláusulas contractuales tipo aprobadas por la Comisión Europea.',
    ],
  },
  {
    title: 'Tus derechos',
    paragraphs: [
      `Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar tu consentimiento, escribiendo a ${owner(OWNER.email)}. Te responderemos en el plazo máximo de un mes.`,
      'Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).',
    ],
  },
  {
    title: 'Cookies y almacenamiento local',
    paragraphs: [
      'Esta web no usa cookies de análisis, publicidad ni seguimiento, por eso no te mostramos ningún aviso de cookies. Solo guarda información técnica en tu navegador:',
    ],
    items: [
      'Mientras rellenas la reserva, un borrador en el almacenamiento de sesión del navegador (sessionStorage), para que no pierdas lo escrito si recargas la página. Se borra al enviar la reserva o al cerrar la pestaña.',
      'En el área privada de administración, la sesión de la persona que gestiona las reservas.',
    ],
  },
]

export const LEGAL_NOTICE_SECTIONS: LegalSection[] = [
  {
    title: 'Titular de la web',
    paragraphs: [
      'En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:',
    ],
    items: [
      `Titular: ${owner(OWNER.name)} (${OWNER.brand}).`,
      `NIF: ${owner(OWNER.nif)}.`,
      contactLine,
    ],
  },
  {
    title: 'Objeto',
    paragraphs: [
      'Esta web informa sobre los paquetes de sesiones de fotos de Navidad 2026 y permite reservar una sesión. La reserva queda pendiente hasta que se comprueba el pago del adelanto y se confirma.',
    ],
  },
  {
    title: 'Propiedad intelectual',
    paragraphs: [
      'Todas las imágenes de esta web son propiedad de Mónica Robles y están protegidas por la legislación de propiedad intelectual. No está permitida su reproducción, distribución ni transformación sin autorización expresa, salvo para compartir la web citando su origen.',
      'Los textos, el diseño y el resto de contenidos también pertenecen a su titular.',
    ],
  },
  {
    title: 'Responsabilidad',
    paragraphs: [
      'El titular procura que la información de la web sea correcta y esté actualizada, pero no se hace responsable de errores tipográficos ni de interrupciones del servicio ajenas a su control. Los enlaces a otras webs (como Instagram) se ofrecen a título informativo.',
    ],
  },
  {
    title: 'Protección de datos',
    paragraphs: [
      'El tratamiento de los datos personales que se recogen al reservar se explica en la política de privacidad.',
    ],
  },
  {
    title: 'Legislación aplicable',
    paragraphs: [
      'Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someterán a los juzgados y tribunales que correspondan conforme a la normativa de consumidores y usuarios.',
    ],
  },
]
