import { formatEURCompact } from '@/lib/money'
import { PACKAGES } from './packages'
import { BOOKING, PRESALE } from './site'

/**
 * Manual de usuario que se muestra en /admin/manual.
 * Si cambia el funcionamiento de la web, actualiza aquí el texto correspondiente.
 */

export interface ManualSection {
  /** Ancla para el índice (#id). */
  id: string
  title: string
  paragraphs?: string[]
  /** Pasos numerados. */
  steps?: string[]
  /** Viñetas. */
  items?: string[]
  /** Consejo destacado al final de la sección. */
  tip?: string
}

export interface Manual {
  title: string
  intro: string
  sections: ManualSection[]
}

const deposit = formatEURCompact(BOOKING.depositCents)
const babyExtra = formatEURCompact(BOOKING.babyExtraCents)
const minNoticeH = BOOKING.minNoticeMin / 60

const packageItems = PACKAGES.map(
  (p) => `Paquete ${p.number} · ${p.name}: ${p.durationMin} min, ${formatEURCompact(p.priceCents)}.`,
)

export const CLIENT_MANUAL: Manual = {
  title: 'Manual para clientes',
  intro:
    'Cómo usa la web una persona que quiere reservar su sesión de Navidad: desde que entra en la página de inicio hasta que recibe el código de reserva. Te sirve para resolver las dudas que te lleguen por WhatsApp.',
  sections: [
    {
      id: 'cliente-inicio',
      title: 'La página de inicio',
      paragraphs: [
        'La página de inicio presenta la campaña: los paquetes con sus precios, la galería de fotos, la escapada a Espadilla, los extras, la información adicional (forma de pago, pruebas y entrega), «Sobre mí» y los datos de contacto.',
        `Durante la preventa (del 11 al 16 de octubre) los precios aparecen con un ${PRESALE.discountPct} % de descuento y el precio normal tachado. Pasado ese plazo se aplica el precio normal automáticamente.`,
      ],
      items: packageItems,
    },
    {
      id: 'cliente-empezar',
      title: 'Empezar la reserva',
      paragraphs: ['Hay varias formas de llegar a la reserva:'],
      items: [
        'El botón «Reservar» de la cabecera, visible en todas las páginas.',
        'El botón «Reservar mi sesión» de la portada y del final de la página.',
        'El botón «Reservar este paquete» de cada paquete: entra en la reserva con ese paquete ya elegido.',
      ],
      tip: 'La reserva tiene 5 pasos. Arriba de cada paso hay una barra con el progreso y los botones «Atrás» y «Siguiente».',
    },
    {
      id: 'cliente-paso1',
      title: 'Paso 1 · Elige tu paquete',
      steps: [
        'Elige uno de los tres paquetes.',
        `Si en la sesión hay un bebé, marca «Ampliación de tiempo para bebé» (+${babyExtra}, +${BOOKING.babyExtraMin} min).`,
        'Debajo se muestran la duración y el precio total. Pulsa «Siguiente».',
      ],
    },
    {
      id: 'cliente-paso2',
      title: 'Paso 2 · Fecha y hora',
      steps: [
        'En el calendario, los días con huecos libres aparecen resaltados. Pulsa uno.',
        'A la derecha (o debajo, en el móvil) aparece la línea del día con los huecos libres. Pulsa la hora que prefieras.',
        'Pulsa «Siguiente».',
      ],
      items: [
        'Solo se ofrecen horas en las que cabe la sesión entera, contando la ampliación para bebé si se ha marcado.',
        `No se puede reservar con menos de ${minNoticeH} horas de antelación.`,
        'Los huecos se actualizan solos cada minuto. Si otra persona reserva la hora elegida, se pide elegir otra.',
        'Si no hay huecos, se muestra «De momento no hay huecos disponibles» con un enlace a Instagram.',
      ],
    },
    {
      id: 'cliente-paso3',
      title: 'Paso 3 · Tus datos',
      items: [
        'Nombre y apellidos.',
        'Email y teléfono (mínimo 9 cifras). Son los datos con los que contactarás con el cliente.',
        'Participantes: número de niños y adultos y sus edades.',
        'Notas (opcional): cualquier cosa que debas saber antes de la sesión.',
        'Aceptar la política de privacidad (obligatorio).',
      ],
      tip: 'Si falta algo o está mal escrito, el campo se marca en rojo con una explicación.',
    },
    {
      id: 'cliente-paso4',
      title: 'Paso 4 · Adelanto y comprobante',
      steps: [
        `El cliente paga el adelanto de ${deposit} por Bizum (el número que guardes en Perfil) o por transferencia, con el concepto «Navidad + su nombre». Cada dato tiene un botón «Copiar».`,
        'Sube el comprobante con «Subir comprobante»: una captura del Bizum o el justificante de la transferencia (JPG, PNG, WEBP o PDF, máximo 5 MB).',
        'Revisa el resumen de la reserva y pulsa «Enviar reserva».',
      ],
      items: [
        'Sin comprobante no se puede enviar la reserva.',
        'Si se sube un archivo equivocado, se cambia con «Cambiar archivo».',
        'Si al enviar la hora ya está ocupada, vuelve al paso 2 conservando los datos y el comprobante.',
        'El resto del importe se paga en efectivo el día de la sesión.',
      ],
    },
    {
      id: 'cliente-paso5',
      title: 'Paso 5 · ¡Reserva recibida!',
      paragraphs: [
        'La reserva queda «pendiente de comprobación» y se muestra un código de 8 caracteres (por ejemplo, 3F2A9C1B) junto con el resumen. El hueco queda bloqueado mientras revisas la reserva.',
        'La web no envía emails ni mensajes: el cliente espera a que tú le confirmes. Si te escribe, pídele el código para encontrar su reserva rápidamente.',
      ],
    },
    {
      id: 'cliente-salir',
      title: 'Salir o recargar a mitad de la reserva',
      items: [
        'Si sale a otra página de la web a mitad de la reserva, se le pregunta «¿Salir de la reserva?». Si confirma, lo introducido se pierde y la próxima vez empieza desde el paso 1.',
        'Si recarga la página, la reserva sigue en el mismo paso con los datos escritos.',
        'Si cierra la pestaña, se borra todo lo introducido.',
        'Mientras la reserva no se envía, la hora no queda guardada: otra persona puede reservarla.',
      ],
    },
    {
      id: 'cliente-contacto',
      title: 'Dudas y contacto',
      paragraphs: [
        'El botón flotante de WhatsApp (abajo a la derecha) ofrece consultas rápidas: días libres, ayuda para elegir paquete y dudas sobre una reserva. Al pulsarlas se abre WhatsApp con el mensaje ya escrito.',
        'El pie de la web muestra el teléfono, el email y las redes sociales que guardes en Perfil, y los enlaces a la política de privacidad y al aviso legal.',
      ],
    },
  ],
}

export const ADMIN_MANUAL: Manual = {
  title: 'Manual de administración',
  intro:
    'Cómo gestionar las reservas, la disponibilidad y tu perfil desde el panel de administración (/admin).',
  sections: [
    {
      id: 'admin-acceso',
      title: 'Entrar y salir',
      steps: [
        'Abre la dirección de la web terminada en /admin.',
        'Escribe tu email y tu contraseña y pulsa «Entrar».',
        'Al terminar, pulsa «Cerrar sesión» en el menú, sobre todo en un ordenador compartido.',
      ],
      items: [
        'No existe el registro público: solo pueden entrar las cuentas de administración que haya dado de alta el desarrollador.',
        'En el móvil, el menú se abre con el botón ☰ de la esquina. Un punto rojo indica que hay reservas pendientes.',
      ],
    },
    {
      id: 'admin-rutina',
      title: 'Rutina recomendada',
      paragraphs: [
        'La web no envía avisos de reservas nuevas. Entra en el panel con regularidad y mira el número rojo junto a «Reservas»: son las reservas pendientes de revisar.',
      ],
      steps: [
        'Abre «Reservas» (pestaña «Pendientes»).',
        'Abre cada reserva y comprueba el comprobante: importe del adelanto, concepto y fecha.',
        'Acéptala o recházala.',
        'Escribe al cliente por WhatsApp o llámale para confirmarle la sesión.',
      ],
      tip: 'Las pantallas se recargan solas al volver a la pestaña del navegador. También puedes pulsar «Actualizar».',
    },
    {
      id: 'admin-hoy',
      title: 'Hoy',
      paragraphs: [
        'Es la pantalla de inicio del panel: la agenda del día con las sesiones pendientes y aceptadas.',
      ],
      items: [
        'Arriba, el resumen: sesiones del día, pendientes de revisar y sesiones ya hechas.',
        'La sesión en curso o la siguiente se resalta en verde; las ya terminadas aparecen atenuadas con «✓ Hecha».',
        'Pulsa una tarjeta para abrir el detalle de la reserva.',
        'Las pendientes tienen el botón «Aprobar». Antes de aprobar, revisa el comprobante en el detalle.',
        'Cada tarjeta tiene botones para llamar y para abrir WhatsApp con el cliente.',
        'Si hoy no tienes sesiones, se muestra directamente la lista de reservas.',
      ],
    },
    {
      id: 'admin-reservas',
      title: 'Reservas',
      items: [
        'Pestañas por estado: Pendientes, Aceptadas, Rechazadas y Todas.',
        'Por defecto solo se ven las sesiones de hoy en adelante. Marca «Mostrar pasadas» para ver también las anteriores.',
        'En el ordenador se muestra una tabla; en el móvil, tarjetas. Pulsa una reserva para abrir el detalle.',
      ],
    },
    {
      id: 'admin-buscar',
      title: 'Buscar una reserva',
      steps: [
        'En «Reservas», despliega «Buscar reservas».',
        'Busca por código de reserva, nombre del cliente, fecha de la sesión u hora (encuentra la sesión que está en curso a esa hora). Puedes combinar varios criterios.',
        'Pulsa «✕ Limpiar» para quitar la búsqueda.',
      ],
      tip: 'La búsqueda filtra la pestaña actual. Si no aparece nada, pulsa «Buscar en todas las reservas, también las pasadas».',
    },
    {
      id: 'admin-detalle',
      title: 'Detalle de una reserva: aceptar o rechazar',
      paragraphs: [
        'El detalle muestra el código, el cliente, la fecha y hora, el paquete, la duración y el precio.',
      ],
      items: [
        'Importe: total, adelanto y resto a cobrar en efectivo el día de la sesión.',
        'Cliente: email, participantes, notas y botones de teléfono y WhatsApp.',
        'Registro: cuándo se recibió, cuándo se aceptó la privacidad, cuándo se revisó y la nota interna.',
        'Comprobante: la imagen o el PDF que subió el cliente.',
      ],
      steps: [
        'Revisa el comprobante.',
        'Pulsa «✓ Aceptar» o «✕ Rechazar». Puedes añadir una nota interna (solo la ves tú).',
        'Confirma en la ventana. Vuelves a la lista con un aviso.',
      ],
      tip: 'Rechazar una reserva libera su hueco para otros clientes. Una reserva aceptada se puede cancelar con «Cancelar (rechazar)». Una reserva rechazada no se puede recuperar: el cliente tendría que reservar de nuevo.',
    },
    {
      id: 'admin-disponibilidad',
      title: 'Disponibilidad',
      paragraphs: [
        'Aquí decides qué días y horas se pueden reservar. Se abre en el mes actual: a la izquierda el calendario (arriba en el móvil) y a la derecha el día elegido, con sus horas.',
        'En el calendario, cada día muestra sus rangos: verde azulado = disponible, rojo con ✕ = no disponible, ↻ = rango en serie, y cuántas reservas tiene.',
      ],
      steps: [
        'Toca un día del calendario (con ‹ › cambias de mes).',
        'En las horas del día, arrastra desde la hora de inicio hasta la de fin. En el móvil, toca la hora de inicio y después la de fin. También puedes pulsar «+ Añadir rango».',
        'Revisa el horario (puedes cambiar «Desde» y «Hasta»).',
        'Elige si es un rango «Disponible» o «No disponible» (por ejemplo, una hora libre en medio de una mañana disponible).',
        'Elige la repetición: «Único» (solo ese día) o «En serie». En serie, «Mes actual» lo aplica a ese mismo día de la semana en todo el mes; «Hasta» lo aplica a ese día de la semana desde ese mes hasta la fecha que elijas.',
        'Revisa a qué días se aplica y pulsa «Guardar».',
      ],
      items: [
        'Para cambiar o quitar un rango, toca el día y usa «Editar» o «Eliminar». En una serie, el cambio afecta a toda la serie.',
        'Si al editar una serie desaparecen días (por ejemplo, la pasas a «Único» o adelantas la fecha «Hasta»), se avisa y se pide confirmación. Eliminar una serie también avisa de todos los días que se quitan.',
        'Si un cambio dejaría alguna reserva activa sin disponibilidad, se muestra la reserva (código, fecha, hora y cliente) y no se deja guardar: ajusta el rango o rechaza antes esa reserva.',
        'Los días anteriores a hoy no se modifican.',
        `Entre sesiones se deja un margen de ${BOOKING.bufferMin} min automáticamente: no hace falta descontarlo de los rangos.`,
        'Los tramos más cortos que la sesión más corta no se ofrecen porque no sirven para reservar.',
      ],
      tip: 'Una forma rápida de trabajar: crea una serie «Disponible» con tu horario habitual y añade rangos únicos «No disponible» los días que tengas otro compromiso.',
    },
    {
      id: 'admin-dashboard',
      title: 'Dashboard',
      paragraphs: [
        'Estadísticas de la temporada. Con «Sesiones de» eliges toda la temporada o un mes concreto.',
      ],
      items: [
        'Reservas (pendientes, aceptadas y rechazadas) y tasa de aceptación.',
        'Ocupación: minutos reservados frente a minutos abiertos en la disponibilidad.',
        'Ticket medio, facturación aceptada, adelantos cobrados y lo que queda por cobrar en las sesiones.',
        'Reservas hechas en preventa y con ampliación para bebé.',
        'Gráficos por estado, por paquete, sesiones por semana y reservas recibidas por día.',
      ],
    },
    {
      id: 'admin-perfil',
      title: 'Perfil',
      paragraphs: ['Lo que guardas aquí se publica en la web al momento.'],
      items: [
        'Datos de contacto: nombre completo, teléfono (para llamadas y WhatsApp) y email público.',
        'Pago del adelanto: el número de Bizum que ve el cliente en el paso 4 de la reserva.',
        'Redes sociales: escribe tu usuario o pega el enlace del perfil de Instagram, Facebook o TikTok.',
        'Sobre mí: activa o desactiva la sección en la página de inicio, sube o quita la foto (JPG, PNG o WEBP; se recorta en cuadrado y se muestra redonda) y escribe tu presentación (hasta 3000 caracteres).',
      ],
      tip: 'Cuando hay cambios aparece «Tienes cambios sin guardar». Pulsa «Guardar perfil» y comprueba el resultado con «Ver la web ↗».',
    },
    {
      id: 'admin-limites',
      title: 'Lo que no se cambia desde el panel',
      paragraphs: [
        'Los paquetes, los precios, las fechas de la preventa, los textos de la web, las fotos, el IBAN y los textos legales están en el código. Para cambiarlos, pídeselo al desarrollador.',
        'Los comprobantes de más de 6 meses se borran periódicamente por protección de datos.',
      ],
    },
  ],
}
