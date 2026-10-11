import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const TZ = 'Europe/Madrid'

/** Convierte cualquier instante a la hora de Madrid. */
export function toMadrid(date: Date | string | number): TZDate {
  return new TZDate(new Date(date).getTime(), TZ)
}

/** "sábado, 7 de noviembre" */
export function formatDateLong(date: Date | string | number): string {
  return format(toMadrid(date), "EEEE, d 'de' MMMM", { locale: es })
}

/** Día en Madrid como clave "2026-11-07". */
export function dayKey(date: Date | string | number): string {
  return format(toMadrid(date), 'yyyy-MM-dd')
}

/** Mes en Madrid como clave "2026-11". */
export function monthKey(date: Date | string | number): string {
  return format(toMadrid(date), 'yyyy-MM')
}

/** "10:30" */
export function formatTime(date: Date | string | number): string {
  return format(toMadrid(date), 'HH:mm', { locale: es })
}

/** Minutos desde la medianoche de Madrid (10:30 → 630). */
export function minutesOfDay(date: Date | string | number): number {
  const d = toMadrid(date)
  return d.getHours() * 60 + d.getMinutes()
}

/** "sáb 7 nov" */
export function formatDateShort(date: Date | string | number): string {
  return format(toMadrid(date), 'EEE d MMM', { locale: es })
}

/** "7 nov 2026, 10:30" */
export function formatDateTime(date: Date | string | number): string {
  return format(toMadrid(date), "d MMM yyyy', 'HH:mm", { locale: es })
}

/** Instante de un día ("2026-11-07") y hora ("10:30") de Madrid. */
export function madridDateTime(day: string, time: string): Date {
  const [year, month, date] = day.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(new TZDate(year, month - 1, date, hours, minutes, TZ).getTime())
}

/** Medianoche de hoy en Madrid. */
export function startOfMadridDay(date: Date | string | number): Date {
  return madridDateTime(dayKey(date), '00:00')
}
