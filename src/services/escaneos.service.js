import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { filterPromosValidToday } from '../utils/promo.js'
import { resolveMiembro } from './usuarios.service.js'

const ESCANEO_SELECT = `
  id,
  escaneado_en,
  usuarios:socio_id (nombre, apellido, codigo)
`

export async function registerEscaneo({ codigo, localId }) {
  const socio = await resolveMiembro({ codigo })

  const { data, error } = await supabaseAdmin
    .from('escaneos')
    .insert({
      socio_id: socio.id,
      local_id: localId,
      escaneado_en: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw new AppError('No se pudo registrar el escaneo', 500, error)
  }

  if (!socio.activo) {
    throw new AppError('El miembro está inactivo', 409)
  }

  const { data: promos, error: promosError } = await supabaseAdmin
    .from('promos')
    .select('*')
    .eq('local_id', localId)
    .eq('activa', true)

  if (promosError) {
    throw new AppError('No se pudieron obtener los beneficios del local', 500, promosError)
  }

  const beneficiosActivos = filterPromosValidToday(promos ?? []).length

  return {
    socio: {
      nombre: `${socio.nombre} ${socio.apellido}`,
      activo: socio.activo,
    },
    beneficios_activos: beneficiosActivos,
    escaneo_id: data.id,
  }
}

export async function listEscaneos({ local_id, desde, hasta, limit = 50, offset = 0 } = {}) {
  let query = supabaseAdmin
    .from('escaneos')
    .select(ESCANEO_SELECT, { count: 'exact' })
    .order('escaneado_en', { ascending: false })
    .range(offset, offset + limit - 1)

  if (local_id) query = query.eq('local_id', local_id)
  if (desde) query = query.gte('escaneado_en', `${desde}T03:00:00.000Z`)
  if (hasta) {
    const end = new Date(`${hasta}T03:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    query = query.lt('escaneado_en', end.toISOString())
  }

  const { data, error, count } = await query

  if (error) {
    throw new AppError('No se pudieron obtener los escaneos', 500, error)
  }

  return { data, count }
}
