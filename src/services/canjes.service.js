import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { normalizeCodigo } from '../utils/codigo.js'
import { getPeriodBounds, getArgentinaMonthBounds, getLastNDaysDateStrings } from '../utils/date.js'
import { isPromoValidToday } from '../utils/promo.js'
import { getPromoById } from './promos.service.js'
import { resolveMiembro } from './usuarios.service.js'

const CANJE_SELECT = `
  id,
  fecha,
  estado,
  usuarios (nombre, apellido, codigo),
  promos (titulo)
`

const LIMIT_MESSAGES = {
  dia: 'El miembro ya usó este beneficio hoy',
  semana: 'El miembro ya alcanzó el límite semanal de este beneficio',
  mes: 'El miembro ya alcanzó el límite mensual de este beneficio',
  vigencia: 'El miembro ya alcanzó el límite de este beneficio',
}

async function countCanjesInPeriod({ usuario_id, promo_id, periodo, promo }) {
  const bounds = getPeriodBounds(periodo, promo)
  if (!bounds) return 0

  const { count, error } = await supabaseAdmin
    .from('canjes')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuario_id)
    .eq('promo_id', promo_id)
    .eq('estado', 'ok')
    .gte('fecha', bounds.start)
    .lt('fecha', bounds.end)

  if (error) {
    throw new AppError('No se pudo verificar el límite de uso', 500, error)
  }

  return count ?? 0
}

async function assertCanjeLimit({ usuario, promo }) {
  const { limite_cantidad, limite_periodo } = promo

  if (!limite_cantidad || limite_periodo === 'ilimitado') return

  const used = await countCanjesInPeriod({
    usuario_id: usuario.id,
    promo_id: promo.id,
    periodo: limite_periodo,
    promo,
  })

  if (used >= limite_cantidad) {
    throw new AppError(
      LIMIT_MESSAGES[limite_periodo] ?? 'El miembro ya alcanzó el límite de este beneficio',
      409
    )
  }
}

function assertPromoOwnership(promo, localId) {
  if (promo.local_id !== localId) {
    throw new AppError('Esa promo no es de tu local', 403)
  }
}

function assertPromoValidToday(promo) {
  if (!isPromoValidToday(promo)) {
    throw new AppError('El beneficio no es válido hoy', 409)
  }
}

function assertMiembroActivo(usuario) {
  if (!usuario.activo) {
    throw new AppError('El miembro está inactivo', 409)
  }
}

export async function registerCanje({ codigo, usuario_id, promo_id, actorLocalId, isAdmin }) {
  const usuario = await resolveMiembro({ codigo, usuario_id })
  assertMiembroActivo(usuario)

  const promo = await getPromoById(promo_id)

  if (!isAdmin) {
    assertPromoOwnership(promo, actorLocalId)
  }

  assertPromoValidToday(promo)
  await assertCanjeLimit({ usuario, promo })

  const { data, error } = await supabaseAdmin
    .from('canjes')
    .insert({
      usuario_id: usuario.id,
      promo_id: promo.id,
      local_id: promo.local_id,
      estado: 'ok',
      fecha: new Date().toISOString(),
    })
    .select('id, usuario_id, promo_id, local_id, estado, fecha')
    .single()

  if (error) {
    throw new AppError('No se pudo registrar el canje', 500, error)
  }

  return data
}

function buildCanjesQuery({ local_id, promo_id, desde, hasta, estado }) {
  let query = supabaseAdmin
    .from('canjes')
    .select(CANJE_SELECT, { count: 'exact' })
    .order('fecha', { ascending: false })

  if (local_id) query = query.eq('local_id', local_id)
  if (promo_id) query = query.eq('promo_id', promo_id)
  if (estado) query = query.eq('estado', estado)
  if (desde) query = query.gte('fecha', `${desde}T03:00:00.000Z`)
  if (hasta) {
    const end = new Date(`${hasta}T03:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    query = query.lt('fecha', end.toISOString())
  }

  return query
}

export async function listCanjes({ local_id, promo_id, desde, hasta, estado, limit = 50, offset = 0 } = {}) {
  const query = buildCanjesQuery({ local_id, promo_id, desde, hasta, estado })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new AppError('No se pudieron obtener los canjes', 500, error)
  }

  return { data, count }
}

async function fetchCanjesForStats({ local_id, desde, hasta }) {
  let query = supabaseAdmin
    .from('canjes')
    .select('id, usuario_id, promo_id, fecha, promos(titulo)')
    .eq('estado', 'ok')

  if (local_id) query = query.eq('local_id', local_id)
  if (desde) query = query.gte('fecha', `${desde}T03:00:00.000Z`)
  if (hasta) {
    const end = new Date(`${hasta}T03:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    query = query.lt('fecha', end.toISOString())
  }

  const { data, error } = await query

  if (error) {
    throw new AppError('No se pudieron obtener las métricas de canjes', 500, error)
  }

  return data ?? []
}

export async function getCanjesStats({ local_id } = {}) {
  const monthBounds = getArgentinaMonthBounds()
  const monthStartDate = monthBounds.start.slice(0, 10)
  const monthEndDate = new Date(monthBounds.end)
  monthEndDate.setUTCDate(monthEndDate.getUTCDate() - 1)
  const monthEndStr = monthEndDate.toISOString().slice(0, 10)

  const monthCanjes = await fetchCanjesForStats({
    local_id,
    desde: monthStartDate,
    hasta: monthEndStr,
  })

  const last7Days = getLastNDaysDateStrings(7)
  const weekCanjes = await fetchCanjesForStats({
    local_id,
    desde: last7Days[0],
    hasta: last7Days[last7Days.length - 1],
  })

  const canjesPorDia = last7Days.map((fecha) => {
    const { start, end } = getPeriodBounds('dia', null, new Date(`${fecha}T12:00:00.000Z`))
    const cantidad = weekCanjes.filter((c) => c.fecha >= start && c.fecha < end).length
    return { fecha, cantidad }
  })

  const miembrosUnicosMes = new Set(monthCanjes.map((c) => c.usuario_id)).size

  const promoCounts = {}
  for (const canje of monthCanjes) {
    const key = canje.promo_id
    if (!promoCounts[key]) {
      promoCounts[key] = { promo_id: key, titulo: canje.promos?.titulo ?? null, cantidad: 0 }
    }
    promoCounts[key].cantidad++
  }

  const beneficioMasCanjeado = Object.values(promoCounts).sort((a, b) => b.cantidad - a.cantidad)[0] ?? null

  return {
    canjes_mes: monthCanjes.length,
    canjes_ultimos_7_dias: canjesPorDia,
    miembros_unicos_mes: miembrosUnicosMes,
    beneficio_mas_canjeado: beneficioMasCanjeado,
  }
}