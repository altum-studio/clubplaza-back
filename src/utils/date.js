const APP_TIMEZONE = 'America/Argentina/Buenos_Aires'

const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function getArgentinaDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(date)
}

export function getArgentinaDayOfWeek(date = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(date)

  return WEEKDAY_MAP[weekday]
}

export function getArgentinaDayBounds(date = new Date()) {
  const dateStr = getArgentinaDateString(date)
  const start = new Date(`${dateStr}T03:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function parseArgentinaDate(dateStr) {
  return new Date(`${dateStr}T03:00:00.000Z`)
}

export function getArgentinaWeekBounds(date = new Date()) {
  const dayOfWeek = getArgentinaDayOfWeek(date)
  const todayStr = getArgentinaDateString(date)
  const todayStart = parseArgentinaDate(todayStr)
  todayStart.setUTCDate(todayStart.getUTCDate() - dayOfWeek)

  const end = new Date(todayStart)
  end.setUTCDate(end.getUTCDate() + 7)

  return { start: todayStart.toISOString(), end: end.toISOString() }
}

export function getArgentinaMonthBounds(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)

  const year = parts.find((p) => p.type === 'year').value
  const month = parts.find((p) => p.type === 'month').value
  const start = new Date(`${year}-${month}-01T03:00:00.000Z`)
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)

  return { start: start.toISOString(), end: end.toISOString() }
}

export function getPeriodBounds(periodo, promo = null, date = new Date()) {
  switch (periodo) {
    case 'dia':
      return getArgentinaDayBounds(date)
    case 'semana':
      return getArgentinaWeekBounds(date)
    case 'mes':
      return getArgentinaMonthBounds(date)
    case 'vigencia': {
      if (!promo) throw new Error('promo requerida para periodo vigencia')
      const end = parseArgentinaDate(promo.vigencia_hasta)
      end.setUTCDate(end.getUTCDate() + 1)
      return {
        start: parseArgentinaDate(promo.vigencia_desde).toISOString(),
        end: end.toISOString(),
      }
    }
    default:
      return null
  }
}

export function getLastNDaysDateStrings(n, date = new Date()) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(date)
    d.setDate(d.getDate() - i)
    days.push(getArgentinaDateString(d))
  }
  return days
}
