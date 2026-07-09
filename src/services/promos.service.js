import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

export async function listPromos({ local_id, activa, rubro, limit = 50, offset = 0 } = {}) {
  let query = supabaseAdmin
    .from('promos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (local_id) query = query.eq('local_id', local_id)
  if (rubro) query = query.eq('rubro', rubro)
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
    .select('*')
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
    .select('*')
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
    'tipo',
    'valor',
    'precio_anterior',
    'precio_nuevo',
    'dias',
    'vigencia_desde',
    'vigencia_hasta',
    'limite_cantidad',
    'limite_periodo',
    'banner_url',
    'rubro',
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
    .select('*')
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
