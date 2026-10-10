import type { PackageCode } from '@/content/packages'

type PackageTheme = {
  /** Texto de acento (nombre, precio, viñetas). */
  text: string
  /** Número decorativo de fondo. */
  number: string
  /** Franja superior y botón. */
  bg: string
  /** Texto del botón, con contraste suficiente sobre `bg`. */
  buttonText: string
  /** Borde de la tarjeta. */
  ring: string
  /** Borde del paquete seleccionado en la reserva. */
  ringStrong: string
  /** Franja superior en el selector de la reserva. */
  border: string
  /** Color de la sombra cuando la tarjeta se resalta. */
  shadow: string
}

// Un color de la paleta (@theme) por paquete, para distinguirlos de un vistazo.
// Clases literales para que Tailwind las detecte.
export const PACKAGE_THEME: Record<PackageCode, PackageTheme> = {
  // Cajita de Recuerdos: amarillo dorado, cálido y bien distinto del azul del paquete 2.
  P1: {
    text: 'text-honey-dark',
    number: 'text-honey/40',
    bg: 'bg-honey',
    buttonText: 'text-ink hover:text-cream',
    ring: 'ring-honey/60',
    ringStrong: 'ring-honey',
    border: 'border-honey',
    shadow: 'group-hover:shadow-honey/50 group-focus-within:shadow-honey/50',
  },
  // Kit Navideño: azul petróleo del logo.
  P2: {
    text: 'text-teal',
    number: 'text-teal/20',
    bg: 'bg-teal',
    buttonText: 'text-cream',
    ring: 'ring-teal/40',
    ringStrong: 'ring-teal',
    border: 'border-teal',
    shadow: 'group-hover:shadow-teal/40 group-focus-within:shadow-teal/40',
  },
  // Álbum de Navidad: rojo navideño, como la tapa granate del álbum.
  P3: {
    text: 'text-xmas-red',
    number: 'text-xmas-red/20',
    bg: 'bg-xmas-red',
    buttonText: 'text-cream',
    ring: 'ring-xmas-red/40',
    ringStrong: 'ring-xmas-red',
    border: 'border-xmas-red',
    shadow: 'group-hover:shadow-xmas-red/40 group-focus-within:shadow-xmas-red/40',
  },
}
