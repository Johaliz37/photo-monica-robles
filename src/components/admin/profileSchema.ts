import { z } from 'zod'
import { normalizeHandle } from '@/lib/profile'

// Mismas restricciones que los `check` de la tabla profile (supabase/migrations/0004_profile.sql)
const PHONE_RE = /^\+?[0-9 ]{9,20}$/
const PHONE_MSG = 'Escribe un teléfono válido (9 cifras como mínimo).'

const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === '' || PHONE_RE.test(v), PHONE_MSG)

const handle = (re: RegExp, message: string) =>
  z
    .string()
    .transform(normalizeHandle)
    .refine((v) => re.test(v), message)

export const profileSchema = z.object({
  full_name: z.string().trim().max(120, 'Máximo 120 caracteres.'),
  phone: optionalPhone,
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Escribe un email válido.'),
  bizum: optionalPhone,
  instagram: handle(/^[A-Za-z0-9._]{0,30}$/, 'Usuario no válido: letras, números, punto y _.'),
  facebook: handle(/^[A-Za-z0-9.-]{0,80}$/, 'Usuario no válido: letras, números, punto y guion.'),
  tiktok: handle(/^[A-Za-z0-9._]{0,30}$/, 'Usuario no válido: letras, números, punto y _.'),
  about: z.string().trim().max(3000, 'Máximo 3000 caracteres.'),
  show_about: z.boolean(),
  // Lo rellena la subida de la foto, no se escribe a mano
  photo_path: z.string(),
})

export type ProfileFormInput = z.input<typeof profileSchema>
export type ProfileFormData = z.output<typeof profileSchema>

export const EMPTY_PROFILE_FORM: ProfileFormInput = {
  full_name: '',
  phone: '',
  email: '',
  bizum: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  about: '',
  show_about: true,
  photo_path: '',
}
