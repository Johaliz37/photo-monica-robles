import type { ImageName } from './images.generated'

/** Preventa con descuento (hora de Madrid). */
export const PRESALE = {
  startsAt: '2026-10-11T00:00:00+02:00',
  endsAt: '2026-10-16T23:59:59+02:00',
  discountPct: 10,
} as const

/**
 * Reglas de la reserva. IMPORTANTE: deben coincidir con las constantes SQL de la fase 3
 * (supabase/migrations), que son las que mandan. Si cambias algo aquí, cámbialo también allí.
 */
export const BOOKING = {
  depositCents: 2000,
  babyExtraCents: 2000,
  babyExtraMin: 15,
  bufferMin: 15,
  stepMin: 15,
  /** Antelación mínima para reservar (cfg_min_notice). */
  minNoticeMin: 120,
} as const

/** Temporada de sesiones: el calendario de reservas solo navega entre estos meses. */
export const SEASON = {
  from: '2026-10-01T00:00:00+02:00',
  to: '2027-01-01T00:00:00+01:00',
} as const

// Página 7 del PDF
export const BABY_EXTENSION_HELP =
  'Las sesiones están recomendadas para niños a partir de 6 meses. ¿Tu bebé es más pequeño? Consúltame para adaptar el tiempo de la sesión a sus necesidades.'

export interface Extra {
  text: string
  price: string
}

// Página 8 del PDF
export const EXTRAS: Extra[] = [
  { text: 'Podrás elegir fotos extra en la entrega de las fotos de prueba.', price: '7 €/foto' },
  { text: 'A partir de 10 fotos extra.', price: '6 €/foto' },
  { text: 'Galería completa digital editada sin piel.', price: '50 €' },
]

export interface InfoBlock {
  title: string
  text: string
}

// Página 7 del PDF
export const INFO: InfoBlock[] = [
  {
    title: 'Forma de pago',
    text: 'Para poder reservar tu plaza, se deberá de efectuar un pago de 20 € por adelantado. El día de la sesión se deberá de abonar el resto de la sesión en efectivo.',
  },
  {
    title: 'Prueba de fotos',
    text: 'Recibirás las pruebas de la sesión de fotos mediante un link, en un plazo de 24/48 horas después de la sesión, para que puedas elegir las fotos finales.',
  },
  {
    title: 'Tiempo de entrega archivos digitales',
    text: 'Las fotos que entren en los paquetes se entregarán en la galería online, en un máximo de una semana después de recibir la lista de las fotos seleccionadas. En caso de elegir la galería completa, podrá tardar hasta una semana más.',
  },
  {
    title: 'Sesiones con bebés',
    text: 'Las sesiones están recomendadas para niños a partir de 6 meses. ¿Tu bebé es más pequeño? Consúltame para adaptar el tiempo de la sesión a sus necesidades. Ampliación de tiempo para sesiones con bebés: +20 €.',
  },
]

export interface EspadillaCard {
  title: string
  text: string
  image?: ImageName
  imageAlt?: string
  /** Clases de proporción y encuadre de la foto (por defecto, apaisada 2:1). */
  imageFrame?: string
}

// Página 6 del PDF
export const ESPADILLA = {
  kicker: 'Una escapada en familia a',
  title: 'Espadilla',
  subtitle: 'Naturaleza, rincones con encanto y recuerdos de Navidad',
  intro:
    'A tan solo unos minutos de Castellón y Vila-real, os espera un pequeño pueblo con mucho encanto, perfecto para disfrutar de una mañana diferente en familia.',
  image: 'espadilla-pueblo' as ImageName,
  imageAlt: 'Calle empedrada de Espadilla con el campanario y la cúpula azul de la iglesia',
  cards: [
    {
      title: 'Un pueblo entre montañas',
      text: 'Desconectad del ritmo diario y disfrutad de sus paisajes, su tranquilidad y el encanto de sus calles.',
      image: 'espadilla-montanas',
      imageAlt: 'Vista de Espadilla, con sus casas blancas al pie de las montañas',
      imageFrame: 'aspect-[3/2] object-[center_60%]',
    },
    {
      title: 'Rincones con historia',
      text: 'La Ermita de San Roque y sus alrededores son una parada perfecta para pasear, descubrir su arquitectura y disfrutar de la esencia de Espadilla.',
      image: 'espadilla-ermita',
      imageAlt: 'Fachada blanca de la Ermita de San Roque con su espadaña',
      imageFrame: 'aspect-[4/5] object-[center_35%]',
    },
    {
      title: 'Naturaleza y aire libre',
      text: 'El entorno natural de Espadilla invita a dar un paseo, respirar tranquilidad y compartir tiempo de calidad en familia.',
    },
    {
      title: 'Y, por supuesto… vuestra sesión de Navidad',
      text: 'Aprovechad la visita para vivir una experiencia muy especial y llevaros a casa un recuerdo de este año que os acompañará siempre.',
      image: 'espadilla-trineo',
      imageAlt: 'Trineo blanco y dorado con cojines y mantas entre árboles de Navidad iluminados',
    },
  ] satisfies EspadillaCard[],
}

// TODO: pendiente de Mónica (IBAN y titular).
// El Bizum y las redes se editan en /admin/perfil (tabla profile); los valores de aquí
// solo se usan mientras carga el perfil o si no se puede leer (DEFAULT_PROFILE).
export const PAYMENT = {
  bizum: 'TODO',
  iban: 'TODO',
  holder: 'TODO',
  conceptHint: 'Navidad + tu nombre',
}

export const CONTACT = {
  instagram: 'monicarobles_fotografia',
  instagramUrl: 'https://www.instagram.com/monicarobles_fotografia/',
}

/** Consultas rápidas del botón flotante de WhatsApp: el texto se envía tal cual como mensaje. */
export const WHATSAPP_QUESTIONS: string[] = [
  'Hola, Mónica. Me gustaría saber qué días y horas tienes libres para la sesión de Navidad.',
  'Hola, Mónica. Tengo dudas sobre los paquetes de Navidad 2026, ¿me ayudas a elegir?',
  'Hola, Mónica. Tengo una consulta sobre mi reserva.',
]
