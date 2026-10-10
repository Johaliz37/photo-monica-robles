import { createContext, useContext, type RefObject } from 'react'

type StepInfo = {
  step: number
  total: number
  title: string
  /** Título del paso: recibe el foco al cambiar de paso (lectores de pantalla). */
  headingRef: RefObject<HTMLHeadingElement | null>
}

/** Paso actual de la reserva, para que la barra de navegación muestre el progreso. */
export const StepContext = createContext<StepInfo | null>(null)

export function useStep(): StepInfo {
  const info = useContext(StepContext)
  if (!info) throw new Error('StepNav/Stepper necesitan un StepContext.Provider')
  return info
}
