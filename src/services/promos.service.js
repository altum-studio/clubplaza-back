import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

const PROMO_SELECT = '*, locales(id, nombre, logo_url)'

export async function listPromos({ local_id, activa, limit = 50, offset = 0 } = {}) {
  let query = supabaseAdmin
    .from('promos')
    .select(PROMO_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (local_id) query = query.eq('local_id', local_id)
  if (activa !== undefined) {
    query = query.eq('activa', activa === true || activa === 'true')
  }

  const { data, error, count } = await query

  if (error) {
    throw new AppError('No se pudieron obtener las promos', 500, error)
  }

  return { data, count }
}

export async function getPromoById(id) {
  const { data, error } = await supabaseAdmin
    .from('promos')
    .select(PROMO_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new AppError('Promo no encontrada', 404)
  }

  return data
}

export async function createPromo(payload) {
  const { data, error } = await supabaseAdmin
    .from('promos')
    .insert(payload)
    .select(PROMO_SELECT)
    .single()

  if (error) {
    throw new AppError('No se pudo crear la promo', 500, error)
  }

  return data
}

export async function updatePromo(id, payload) {
  const allowedFields = [
    'titulo',
    'descripcion',
    'descuento',
    'fecha_inicio',
    'fecha_fin',
    'imagen_url',
    'activa',
    'local_id',
  ]
  const updates = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedFields.includes(key))
  )

  if (Object.keys(updates).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('promos')
    .update(updates)
    .eq('id', id)
    .select(PROMO_SELECT)
    .single()

  if (error || !data) {
    throw new AppError('No se pudo actualizar la promo', 500, error)
  }

  return data
}

export async function deletePromo(id) {
  const { data, error } = await supabaseAdmin
    .from('promos')
    .delete()
    .eq('id', id)
    .select('id')
    .single()

  if (error || !data) {
    throw new AppError('No se pudo eliminar la promo', 500, error)
  }

  return data
}
