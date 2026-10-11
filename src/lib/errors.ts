// Traducción de los códigos de error (RPC y validaciones del cliente) a mensajes en español.

const MESSAGES: Record<string, string> = {
  SLOT_TAKEN: 'Ese horario acaba de reservarse. Elige otra hora; tu comprobante se mantiene.',
  OUT_OF_WINDOW: 'Ese horario ya no está disponible.',
  PAST_TIME: 'Las reservas deben hacerse con al menos 2 horas de antelación.',
  RECEIPT_MISSING: 'No hemos podido verificar el comprobante. Vuelve a subirlo.',
  RECEIPT_REUSED: 'Este comprobante ya se usó en otra reserva.',
  TOO_MANY_PENDING: 'Ya tienes reservas pendientes de revisión. Escríbenos por Instagram.',
  CONSENT_REQUIRED: 'Debes aceptar la política de privacidad.',
  RECEIPT_TYPE: 'Formato no admitido. Sube una imagen (JPG, PNG o WEBP) o un PDF.',
  RECEIPT_TOO_BIG: 'El archivo pesa más de 5 MB. Sube una captura de pantalla o un PDF más ligero.',
  // Panel de administración
  WINDOW_OVERLAP: 'Se solapa con una franja existente.',
  WINDOW_HAS_BOOKINGS: 'No se puede borrar: tiene reservas activas. Recházalas primero.',
  INVALID_TRANSITION: 'Esta reserva ya cambió de estado. Recarga la página.',
  NOT_ADMIN: 'Tu usuario no tiene permisos de administración.',
  NOT_FOUND: 'No se ha encontrado. Puede que ya se haya borrado.',
  BOOKINGS_OUTSIDE_WINDOWS:
    'Hay reservas activas que quedarían fuera del nuevo horario. Ajusta la disponibilidad para cubrirlas o recházalas primero.',
  PAST_MONTH: 'Ese mes ya ha pasado.',
  INVALID_DATA: 'Los datos no son válidos. Revisa el formulario.',
}

const GENERIC = 'Ha ocurrido un error. Inténtalo de nuevo.'

export class AppError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'AppError'
    this.code = code
  }
}

/** Código del error: el de AppError o el texto de `raise exception 'CODIGO'` de Postgres. */
export function errorCode(err: unknown): string {
  if (err instanceof AppError) return err.code
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = String((err as { message: unknown }).message)
    if (/^[A-Z_]+$/.test(message)) return message
  }
  return 'UNKNOWN'
}

export function errorMessage(err: unknown): string {
  return MESSAGES[errorCode(err)] ?? GENERIC
}
