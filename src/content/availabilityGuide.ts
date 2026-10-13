import { BOOKING } from './site'

/**
 * Pasos de la guía de /admin/disponibilidad.
 * Si cambia el funcionamiento de la pantalla, actualiza aquí el texto (y el manual en manual.ts).
 */

export interface GuideStep {
  title: string
  /** Párrafos del paso. */
  body: string[]
  /** Valor del atributo data-tour del elemento que se resalta (si no está en pantalla, no se resalta nada). */
  target?: string
}

/** Dónde se vuelve a abrir la guía (se cita en el último paso). */
export const GUIDE_MENU_PATH = 'menú ☰ → Manuales → Guía de disponibilidad'
/** /admin/disponibilidad?guia=1 abre la guía (enlace del menú Manuales). */
export const GUIDE_PARAM = 'guia'
/** Clave de localStorage: la guía ya se ha visto (no se vuelve a abrir sola). */
export const GUIDE_SEEN_KEY = 'admin:availability-guide-seen'

export const AVAILABILITY_GUIDE: GuideStep[] = [
  {
    title: 'Te enseño a usar la disponibilidad',
    body: [
      'Aquí decides qué días y horas se pueden reservar. Los clientes solo ven y reservan las horas que marques como disponibles.',
      'En unos pocos pasos verás cómo abrir horas, bloquearlas y repetirlas en serie.',
    ],
  },
  {
    title: '1. Elige un día',
    target: 'calendar',
    body: [
      'Este es el calendario del mes. Toca un día para trabajar con él; con ‹ › cambias de mes y «Hoy» te devuelve al día de hoy.',
      'Cada día muestra sus rangos: verde azulado = disponible, rojo con ✕ = no disponible, ↻ = rango en serie, y un punto dorado si tiene reservas.',
    ],
  },
  {
    title: '2. Selecciona las horas',
    target: 'timeline',
    body: [
      'En las horas del día elegido, arrastra desde la hora de inicio hasta la de fin.',
      'En el móvil es más fácil tocar la hora de inicio y después la de fin.',
      'Al soltar se abre debajo el formulario del nuevo rango.',
    ],
  },
  {
    title: 'O pulsa «+ Añadir rango»',
    target: 'add-range',
    body: [
      'Si lo prefieres, este botón abre el formulario con un horario de ejemplo y eliges «Desde» y «Hasta» en las listas.',
    ],
  },
  {
    title: '3. Disponible o no disponible',
    target: 'day-panel',
    body: [
      'En el formulario eliges el tipo de rango:',
      '«Disponible» abre esas horas para reservar. «No disponible» las bloquea aunque estén dentro de un rango disponible (por ejemplo, una hora libre en medio de una mañana disponible).',
    ],
  },
  {
    title: '4. ¿Solo ese día o en serie?',
    target: 'day-panel',
    body: [
      '«Único» se aplica solo al día elegido.',
      '«En serie» lo repite el mismo día de la semana: con «Mes actual», en todo ese mes; con «Hasta», desde ese mes hasta la fecha que elijas.',
      'Debajo verás siempre a qué días se aplica antes de guardar.',
    ],
  },
  {
    title: '5. Revisa y guarda',
    target: 'day-panel',
    body: [
      'Pulsa «Guardar». Si el cambio dejara alguna reserva sin hueco, verás la reserva (código, fecha y cliente) y no se podrá guardar hasta que ajustes el rango o rechaces esa reserva.',
      'Si al editar una serie se quitan días, te pediremos confirmación. Los días anteriores a hoy nunca cambian.',
    ],
  },
  {
    title: '6. Cambia o quita rangos',
    target: 'day-rules',
    body: [
      'Aquí aparecen los rangos del día elegido con sus botones «Editar» y «Eliminar». En una serie, el cambio afecta a toda la serie.',
      'Debajo verás también las reservas de ese día.',
    ],
  },
  {
    title: 'Un consejo para ir rápido',
    body: [
      'Crea una serie «Disponible» con tu horario habitual y añade rangos únicos «No disponible» los días que tengas otro compromiso.',
      `No hace falta dejar huecos entre sesiones: la web deja ${BOOKING.bufferMin} min de margen automáticamente.`,
    ],
  },
  {
    title: '¡Listo!',
    target: 'admin-menu',
    body: [
      'Ya sabes manejar la disponibilidad.',
      `Puedes volver a seguir esta guía cuando quieras desde el ${GUIDE_MENU_PATH}. Allí también tienes el manual de usuario completo.`,
    ],
  },
]
