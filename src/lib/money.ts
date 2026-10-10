const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

/** Formatea céntimos como "76,50 €". */
export function formatEUR(cents: number): string {
  return eur.format(cents / 100)
}

const eurCompact = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
})

/** Como formatEUR, pero sin ",00" en importes redondos: "85 €", "76,50 €". */
export function formatEURCompact(cents: number): string {
  return cents % 100 === 0 ? eurCompact.format(cents / 100) : formatEUR(cents)
}
