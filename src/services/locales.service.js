import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

const LOCAL_SELECT = '*, promos(count)'

export async function listLocales({ activo, limit = 50, offset = 0 } = {}) {
  let query = supabaseAdmin
    .from('locales')
    .select(LOCAL_SELECT, { count: 'exact' })
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
    .select(`${LOCAL_SELECT}, promos(*)`)
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
    .select(LOCAL_SELECT)
    .single()

  if (error) {
    throw new AppError('No se pudo crear el local', 500, error)
  }

  return data
}

export async function updateLocal(id, payload) {
  const allowedFields = ['nombre', 'descripcion', 'piso', 'logo_url', 'activo']
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
    .select(LOCAL_SELECT)
    .single()

  if (error || !data) {
    throw new AppError('No se pudo actualizar el local', 500, error)
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
