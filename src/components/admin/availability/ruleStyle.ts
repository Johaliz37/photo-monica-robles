import type { Rule } from '@/lib/availability'

/** Colores de un rango: verde azulado si es disponible, rojo si no. */
export const ruleChipClass = (rule: Pick<Rule, 'kind'>) =>
  rule.kind === 'disponible'
    ? 'bg-teal/10 text-teal ring-teal/30'
    : 'bg-xmas-red/10 text-xmas-red ring-xmas-red/30'
