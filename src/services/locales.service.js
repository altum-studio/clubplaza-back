import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

export async function listLocales({ activo, limit = 50, offset = 0 } = {}) {
  let query = supabaseAdmin
    .from('locales')
    .select('*', { count: 'exact' })
    .order('nombre', { ascending: true })
    .range(offset, offset + limit - 1)

  if (activo !== undefined) {
    query = query.eq('activo', activo === true || activo === 'true')
  }

  const { data, error, count } = await query

  if (error) {
    throw new AppError('No se pudieron obtener los locales', 500, error)
  }

  return { data, count }
}

export async function getLocalById(id) {
  const { data, error } = await supabaseAdmin
    .from('locales')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new AppError('Local no encontrado', 404)
  }

  return data
}

export async function createLocal(payload) {
  const { data, error } = await supabaseAdmin
    .from('locales')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new AppError('No se pudo crear el local', 500, error)
  }

  return data
}

export async function updateLocal(id, payload) {
  const allowedFields = [
    'nombre',
    'descripcion',
    'nro_local',
    'rubro',
    'logo_url',
    'banner_url',
    'horarios',
    'activo',
  ]
  const updates = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedFields.includes(key))
  )

  if (Object.keys(updates).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('locales')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('No se pudo actualizar el local', 500, error)
  }

  if (updates.rubro !== undefined) {
    const { error: promosError } = await supabaseAdmin
      .from('promos')
      .update({ rubro: updates.rubro })
      .eq('local_id', id)

    if (promosError) {
      throw new AppError('No se pudo sincronizar el rubro de las promos', 500, promosError)
    }
  }

  return data
}

export async function deleteLocal(id) {
  const { data, error } = await supabaseAdmin
    .from('locales')
    .delete()
    .eq('id', id)
    .select('id')
    .single()

  if (error || !data) {
    throw new AppError('No se pudo eliminar el local', 500, error)
  }

  return data
}
