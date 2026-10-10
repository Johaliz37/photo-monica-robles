import { z } from 'zod'

// Mismas restricciones que los `check` de la tabla bookings (supabase/migrations)
const PHONE_RE = /^\+?[0-9 ]{9,16}$/

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Escribe tu nombre (mínimo 2 caracteres).')
    .max(120, 'Máximo 120 caracteres.'),
  email: z.string().trim().pipe(z.email('Escribe un email válido.')),
  phone: z
    .string()
    .trim()
    .regex(PHONE_RE, 'Escribe un teléfono válido (9 cifras como mínimo).')
    // El servidor quita los espacios antes de validar
    .refine(
      (v) => PHONE_RE.test(v.replace(/ /g, '')),
      'Escribe un teléfono válido (9 cifras como mínimo).',
    ),
  participants: z
    .string()
    .trim()
    .min(1, 'Indica quién participa en la sesión.')
    .max(300, 'Máximo 300 caracteres.'),
  notes: z.string().trim().max(1000, 'Máximo 1000 caracteres.'),
  consent: z.boolean().refine((v) => v, 'Debes aceptar la política de privacidad.'),
})

export type ClientData = z.infer<typeof clientSchema>

export const EMPTY_CLIENT: ClientData = {
  name: '',
  email: '',
  phone: '',
  participants: '',
  notes: '',
  consent: false,
}
