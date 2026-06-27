import { supabaseAdmin } from '../config/supabase.js'
import { pickAllowedFields, USUARIO_UPDATE_FIELDS } from '../constants/usuario.js'
import { AppError } from '../utils/AppError.js'
import { generateUniqueMemberCode, normalizeCodigo } from '../utils/codigo.js'

const USUARIO_SELECT = '*, locales(id, nombre)'

const MIEMBRO_PUBLIC_SELECT = 'id, nombre, apellido, codigo, dni, activo, created_at'

export async function listUsuarios({ rol, local_id, limit = 50, offset = 0 } = {}) {
  let query = supabaseAdmin
    .from('usuarios')
    .select(USUARIO_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (rol) query = query.eq('rol', rol)
  if (local_id) query = query.eq('local_id', local_id)

  const { data, error, count } = await query

  if (error) {
    throw new AppError('No se pudieron obtener los usuarios', 500, error)
  }

  return { data, count }
}

export async function getUsuarioById(id) {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select(USUARIO_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new AppError('Usuario no encontrado', 404)
  }

  return data
}

export async function getMiembroByCodigo(codigo) {
  const normalized = normalizeCodigo(codigo)

  if (!normalized) {
    throw new AppError('codigo es requerido', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select(MIEMBRO_PUBLIC_SELECT)
    .eq('codigo', normalized)
    .maybeSingle()

  if (error) {
    throw new AppError('No se pudo buscar el miembro', 500, error)
  }

  if (!data) {
    throw new AppError('Miembro no encontrado', 404)
  }

  return data
}

export async function resolveMiembro({ codigo, usuario_id }) {
  if (codigo) {
    return getMiembroByCodigo(codigo)
  }

  if (usuario_id) {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select(MIEMBRO_PUBLIC_SELECT)
      .eq('id', usuario_id)
      .maybeSingle()

    if (error) {
      throw new AppError('No se pudo buscar el miembro', 500, error)
    }

    if (!data) {
      throw new AppError('Miembro no encontrado', 404)
    }

    return data
  }

  throw new AppError('codigo o usuario_id es requerido', 400)
}

export async function createUsuario(payload) {
  const {
    email,
    password,
    nombre,
    apellido,
    fecha_nacimiento,
    dni,
    telefono,
    rol,
    local_id = null,
  } = payload

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    throw new AppError(authError.message, 400)
  }

  const userId = authData.user.id
  const codigo = await generateUniqueMemberCode()

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .insert({
      id: userId,
      nombre,
      apellido,
      fecha_nacimiento,
      email,
      dni,
      telefono,
      rol,
      local_id,
      codigo,
    })
    .select(USUARIO_SELECT)
    .single()

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw new AppError('No se pudo crear el usuario', 500, error)
  }

  return data
}

export async function updateUsuario(id, payload) {
  const updates = pickAllowedFields(payload, USUARIO_UPDATE_FIELDS)

  if (Object.keys(updates).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select(USUARIO_SELECT)
    .single()

  if (error || !data) {
    throw new AppError('No se pudo actualizar el usuario', 500, error)
  }

  return data
}

export async function deleteUsuario(id) {
  const { error: profileError } = await supabaseAdmin
    .from('usuarios')
    .delete()
    .eq('id', id)

  if (profileError) {
    throw new AppError('No se pudo eliminar el perfil del usuario', 500, profileError)
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (authError) {
    throw new AppError('No se pudo eliminar el usuario de auth', 500, authError)
  }

  return { id }
}
