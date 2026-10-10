import type { PackageCode } from '@/content/packages'

// Personajes que se asoman por detrás de la tarjeta del paquete al resaltarla.
// El borde inferior del dibujo (y = 80) coincide con el borde superior de la tarjeta:
// las manos quedan "agarradas" a él.

const OUTLINE = '#4a3b2a'
const SKIN = '#f6d2b8'
const CHEEK = '#f2a7a0'

function Eyes({ y = 46 }: { y?: number }) {
  return (
    <g fill={OUTLINE}>
      <ellipse cx="43" cy={y} rx="2.4" ry="3" />
      <ellipse cx="57" cy={y} rx="2.4" ry="3" />
      <circle cx="43.8" cy={y - 1} r="0.9" fill="#fff" />
      <circle cx="57.8" cy={y - 1} r="0.9" fill="#fff" />
    </g>
  )
}

function Santa() {
  return (
    <g stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round">
      {/* Barba */}
      <path d="M30 48 Q28 80 50 84 Q72 80 70 48 Z" fill="#fff" />
      {/* Cara */}
      <circle cx="50" cy="48" r="16" fill={SKIN} />
      {/* Gorro con la punta caída y pompón */}
      <path d="M33 38 Q38 14 58 16 Q76 18 82 34 Q72 28 66 36 Z" fill="#c62828" />
      <circle cx="82" cy="35" r="4.5" fill="#fff" />
      <rect x="31" y="34" width="38" height="9" rx="4.5" fill="#fff" />
      <Eyes y={49} />
      <circle cx="38" cy="54" r="3" fill={CHEEK} stroke="none" />
      <circle cx="62" cy="54" r="3" fill={CHEEK} stroke="none" />
      {/* Bigote y nariz */}
      <path d="M50 58 Q42 54 37 60 Q44 64 50 60 Q56 64 63 60 Q58 54 50 58 Z" fill="#fff" />
      <circle cx="50" cy="55" r="3.2" fill="#e8a088" />
      {/* Guantes */}
      <ellipse cx="22" cy="78" rx="8" ry="6" fill="#fff" />
      <ellipse cx="78" cy="78" rx="8" ry="6" fill="#fff" />
    </g>
  )
}

function Reindeer() {
  return (
    <g stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      {/* Cornamenta */}
      <path
        d="M40 34 Q34 20 26 14 M33 23 Q28 22 24 24 M60 34 Q66 20 74 14 M67 23 Q72 22 76 24"
        fill="none"
        stroke="#8a5a2b"
        strokeWidth="3.5"
      />
      {/* Orejas */}
      <ellipse cx="31" cy="42" rx="8" ry="4" fill="#a86b35" transform="rotate(-25 31 42)" />
      <ellipse cx="69" cy="42" rx="8" ry="4" fill="#a86b35" transform="rotate(25 69 42)" />
      {/* Cabeza y hocico */}
      <ellipse cx="50" cy="52" rx="16" ry="19" fill="#a86b35" />
      <ellipse cx="50" cy="64" rx="11" ry="8" fill="#e0b58a" />
      <Eyes y={48} />
      {/* Nariz roja */}
      <circle cx="50" cy="60" r="5" fill="#d62828" />
      <circle cx="48.5" cy="58.5" r="1.4" fill="#fff" stroke="none" />
      <path d="M46 68 Q50 71 54 68" fill="none" />
      {/* Pezuñas */}
      <ellipse cx="22" cy="79" rx="7" ry="5.5" fill="#5c3b1e" />
      <ellipse cx="78" cy="79" rx="7" ry="5.5" fill="#5c3b1e" />
    </g>
  )
}

function Gnome() {
  return (
    <g stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round">
      {/* Barba */}
      <path d="M30 50 Q26 82 50 86 Q74 82 70 50 Z" fill="#fff" />
      {/* Gorro cónico que le tapa los ojos */}
      <path d="M28 54 Q34 22 56 4 Q60 26 72 54 Z" fill="#2f4a34" />
      <path d="M28 54 Q50 46 72 54 Q50 60 28 54 Z" fill="#c9a96e" />
      {/* Nariz grande */}
      <ellipse cx="50" cy="60" rx="8" ry="7" fill="#f2b8a0" />
      <circle cx="47.5" cy="57.5" r="1.8" fill="#fff" stroke="none" />
      {/* Manos */}
      <circle cx="22" cy="79" r="6" fill={SKIN} />
      <circle cx="78" cy="79" r="6" fill={SKIN} />
    </g>
  )
}

const CHARACTERS: Record<PackageCode, { drawing: () => React.JSX.Element; message: string }> = {
  P1: { drawing: Santa, message: '¡Jo, jo, jo! ¡Reserva ya!' },
  P2: { drawing: Reindeer, message: '¡Elige tu fecha!' },
  P3: { drawing: Gnome, message: '¡Este es mi favorito!' },
}

type Props = {
  code: PackageCode
  /** Lado de la tarjeta por el que se asoma. */
  side: 'left' | 'right'
}

export default function PeekingCharacter({ code, side }: Props) {
  const { drawing: Drawing, message } = CHARACTERS[code]
  const right = side === 'right'

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-full ${right ? 'right-6' : 'left-6'}`}
    >
      {/* Bocadillo */}
      <p
        className={`absolute bottom-[78px] w-max scale-75 rounded-2xl bg-white px-3 py-1.5 text-xs font-semibold text-ink opacity-0 shadow-md ring-1 ring-gold-light/50 transition delay-0 duration-300 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-300 group-focus-within:scale-100 group-focus-within:opacity-100 group-focus-within:delay-300 ${
          right ? 'right-16 origin-bottom-right' : 'left-16 origin-bottom-left'
        }`}
      >
        {message}
      </p>
      {/* Ventana recortada: el personaje sube desde detrás del borde de la tarjeta */}
      <div className="h-[96px] w-[90px] overflow-hidden">
        <svg
          viewBox="0 0 100 80"
          className="mt-[16px] block h-[80px] w-[90px] translate-y-full transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-y-0 group-focus-within:translate-y-0"
        >
          <Drawing />
        </svg>
      </div>
    </div>
  )
}
