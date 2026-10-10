import type { CSSProperties, ReactNode } from 'react'

// Adornos navideños que caen como nieve, muy sutiles y decorativos.
// Solo CSS: sin JS en cada frame y sin bloquear clics (pointer-events-none).

const SNOWFLAKE = '❄︎' // ︎ fuerza la versión de texto, no el emoji
const SPARKLE = '✦'
const STAR = '★'

function Tree() {
  return (
    <svg viewBox="0 0 16 20" className="size-full" fill="currentColor">
      <path d="M8 0 13 7h-2.5L15 13h-3l4 5H0l4-5H1l4.5-6H3z" />
      <rect x="6.75" y="18" width="2.5" height="2" />
    </svg>
  )
}

function Bauble() {
  return (
    <svg viewBox="0 0 16 18" className="size-full" fill="currentColor">
      <rect x="6" y="0" width="4" height="3" rx="0.5" />
      <circle cx="8" cy="10.5" r="7" />
    </svg>
  )
}

const SHAPES: ReactNode[] = [SNOWFLAKE, SPARKLE, <Tree key="tree" />, SNOWFLAKE, STAR, <Bauble key="bauble" />]
const COLORS = ['text-gold-light', 'text-gold-light', 'text-xmas-red', 'text-pine', 'text-honey']

// Generador pseudoaleatorio con semilla: mismas posiciones en cada render.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const COUNT = 18
const rand = seeded(2026)
const FLAKES = Array.from({ length: COUNT }, (_, i) => {
  const duration = 18 + rand() * 16 // 18–34 s: caída lenta
  return {
    shape: SHAPES[i % SHAPES.length],
    color: COLORS[Math.floor(rand() * COLORS.length)],
    style: {
      left: `${rand() * 100}%`,
      width: `${10 + rand() * 8}px`,
      height: `${10 + rand() * 8}px`,
      fontSize: `${10 + rand() * 8}px`,
      opacity: 0.25 + rand() * 0.25,
      animationDuration: `${duration}s`,
      // Retraso negativo: al cargar ya hay adornos repartidos por la pantalla
      animationDelay: `${-rand() * duration}s`,
    } satisfies CSSProperties,
    swayDuration: `${4 + rand() * 4}s`,
  }
})

// Un reno: cuerpo, cabeza, cornamenta y patas estiradas en pleno vuelo.
function Reindeer({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="14" cy="20" rx="11" ry="4.5" />
      <path d="M21 17 L27 9 L30 11 L24 20 Z" />
      <ellipse cx="30" cy="8.5" rx="4" ry="2.3" />
      <path
        d="M28 6.5 L26 1 M26.8 3.2 L23.5 2.2 M29.5 6.5 L31 1 M30.4 3.5 L33.5 2.5 M22 22 L28 26 M20 23 L25 29 M6 22 L0 25 M8 23 L3 29 M3 18 L0 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  )
}

// Silueta de Papá Noel en su trineo tirado por tres renos, volando hacia la derecha.
function Sleigh() {
  return (
    <svg viewBox="0 0 190 46" className="h-auto w-full" fill="currentColor">
      {/* Riendas */}
      <path d="M30 15 Q 90 24 172 12" fill="none" stroke="currentColor" strokeWidth="0.8" />
      {/* Saco de regalos */}
      <circle cx="9" cy="17" r="7" />
      {/* Papá Noel: gorro, cabeza y cuerpo */}
      <path d="M17.5 8 L26.5 7.5 Q24 2 18 2 Q14 2 12 5 Z" />
      <circle cx="12" cy="5.5" r="1.8" />
      <circle cx="22" cy="10" r="4" />
      <ellipse cx="22" cy="20" rx="7.5" ry="7" />
      {/* Trineo y patín */}
      <path d="M2 24 H40 Q47 24 49 14 H53 Q51 33 36 34 H6 Z" />
      <path
        d="M0 40 Q2 44 8 44 H44 Q50 44 53 38 M12 34 V44 M34 34 V44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Reindeer x={66} y={8} />
      <Reindeer x={108} y={5} />
      <Reindeer x={150} y={2} />
    </svg>
  )
}

// Estrellas fugaces: cada una con su ciclo largo, así aparecen de vez en cuando y a destiempo.
const SHOOTING_STARS: CSSProperties[] = [
  { top: '12%', left: '8%', animationDuration: '17s', animationDelay: '3s' },
  { top: '30%', left: '55%', animationDuration: '23s', animationDelay: '11s' },
  { top: '8%', left: '70%', animationDuration: '31s', animationDelay: '19s' },
  { top: '45%', left: '20%', animationDuration: '37s', animationDelay: '27s' },
]

export default function Snowfall() {
  return (
    <div aria-hidden="true" className="snowfall pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="snowfall-sleigh absolute top-[14vh] left-0 w-[120px] text-ink sm:w-[170px]">
        <div className="snowfall-bob">
          <Sleigh />
        </div>
      </div>
      {SHOOTING_STARS.map((style, i) => (
        <span key={i} className="snowfall-shooting-star absolute" style={style} />
      ))}
      {FLAKES.map((flake, i) => (
        <span
          key={i}
          className={`snowfall-flake absolute top-0 flex items-center justify-center leading-none ${flake.color}`}
          style={flake.style}
        >
          <span
            className="snowfall-sway flex size-full items-center justify-center"
            style={{ animationDuration: flake.swayDuration }}
          >
            {flake.shape}
          </span>
        </span>
      ))}
    </div>
  )
}
