import { getArgentinaDateString, getArgentinaDayOfWeek } from './date.js'

export function isPromoValidToday(promo, date = new Date()) {
  if (!promo?.activa) return false

  const today = getArgentinaDateString(date)
  if (today < promo.vigencia_desde || today > promo.vigencia_hasta) return false

  const dayOfWeek = getArgentinaDayOfWeek(date)
  if (!Array.isArray(promo.dias) || !promo.dias.includes(dayOfWeek)) return false

  return true
}

export function filterPromosValidToday(promos, date = new Date()) {
  return promos.filter((promo) => isPromoValidToday(promo, date))
}
