import Divider from './Divider'

type Props = {
  id?: string
  children: React.ReactNode
  /** Palabra en caligrafía bajo el título, como "Adicional" en el PDF. */
  script?: string
}

export default function SectionTitle({ id, children, script }: Props) {
  return (
    <div className="mb-10 text-center">
      <h2
        id={id}
        className="font-display text-3xl uppercase tracking-[0.15em] text-gold-dark sm:text-4xl"
      >
        {children}
        {script && (
          <span className="-mt-2 block font-script text-5xl normal-case tracking-normal text-gold sm:text-6xl">
            {script}
          </span>
        )}
      </h2>
      <Divider className="mt-4" />
    </div>
  )
}
