import { supabaseAdmin } from '../config/supabase.js'
import { pickAllowedFields, USUARIO_UPDATE_FIELDS } from '../constants/usuario.js'
import { AppError } from '../utils/AppError.js'
import { generateUniqueMemberCode, normalizeCodigo } from '../utils/codigo.js'
import { getArgentinaDateString, getLastNDaysDateStrings } from '../utils/date.js'

const USUARIO_SELECT = '*, locales!usuarios_local_id_fkey(id, nombre), local_managers(local_id)'

function transformUsuario(data) {
  if (!data) return data
  const { local_managers, ...rest } = data
  return {
    ...rest,
    local_ids: (local_managers ?? []).map((m) => m.local_id),
  }
}

async function syncLocalManagers(userId, localIds) {
  const { error: deleteError } = await supabaseAdmin
    .from('local_managers')
    .delete()
    .eq('usuario_id', userId)

  if (deleteError) {
    throw new AppError('No se pudo actualizar los locales del usuario', 500, deleteError)
  }

  if (!localIds?.length) return

  const { error: insertError } = await supabaseAdmin
    .from('local_managers')
    .insert(localIds.map((localId) => ({ usuario_id: userId, local_id: localId })))

  if (insertError) {
    throw new AppError('No se pudo asignar los locales al usuario', 500, insertError)
  }
}

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

  return { data: (data ?? []).map(transformUsuario), count }
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

  return transformUsuario(data)
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
    local_id: payloadLocalId = null,
    local_ids: payloadLocalIds,
  } = payload

  // Determinar localIds y local_id principal
  let localIds = payloadLocalIds ?? (payloadLocalId ? [payloadLocalId] : [])
  let localId = localIds[0] ?? null

  if (rol === 'local' && localIds.length === 0) {
    throw new AppError('Un usuario local debe tener al menos un local asignado', 400)
  }

  if (rol !== 'local') {
    localIds = []
    localId = null
  }

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
      local_id: localId,
      codigo,
    })
    .select(USUARIO_SELECT)
    .single()

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw new AppError('No se pudo crear el usuario', 500, error)
  }

  await syncLocalManagers(userId, localIds)

  return transformUsuario(data)
}

export async function updateUsuario(id, payload) {
  const { local_ids: localIds, ...rest } = payload
  const updates = pickAllowedFields(rest, USUARIO_UPDATE_FIELDS)

  const targetRol = updates.rol

  if (targetRol === 'local') {
    // Cambiando a rol local: requiere local_ids
    const ids = localIds ?? []
    if (!ids.length) throw new AppError('Un usuario local debe tener al menos un local asignado', 400)
    updates.local_id = ids[0]
    await syncLocalManagers(id, ids)
  } else if (targetRol && targetRol !== 'local') {
    // Cambiando a rol no-local: limpiar locales
    updates.local_id = null
    await syncLocalManagers(id, [])
  } else if (localIds !== undefined) {
    // Sin cambio de rol, actualizando local_ids para usuario local
    if (!localIds.length) throw new AppError('Un usuario local debe tener al menos un local asignado', 400)
    updates.local_id = localIds[0]
    await syncLocalManagers(id, localIds)
  }

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

  return transformUsuario(data)
}

export async function getAltasStats(periodo) {
  const now = new Date()

  if (periodo === 'semana') {
    const days = getLastNDaysDateStrings(7, now)
    const startDate = `${days[0]}T03:00:00.000Z`

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('created_at')
      .gte('created_at', startDate)

    if (error) throw new AppError('No se pudieron obtener las estadísticas', 500, error)

    const counts = Object.fromEntries(days.map((d) => [d, 0]))
    for (const row of data ?? []) {
      const dayStr = getArgentinaDateString(new Date(row.created_at))
      if (dayStr in counts) counts[dayStr]++
    }

    return days.map((d) => ({ periodo: d, count: counts[d] }))
  }

  if (periodo === 'mes') {
    const argNow = getArgentinaDateString(now)
    const [yearStr, monthStr] = argNow.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)

    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(year, month - 1 - i, 1))
      months.push(
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      )
    }

    const startDate = `${months[0]}-01T03:00:00.000Z`

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('created_at')
      .gte('created_at', startDate)

    if (error) throw new AppError('No se pudieron obtener las estadísticas', 500, error)

    const counts = Object.fromEntries(months.map((m) => [m, 0]))
    for (const row of data ?? []) {
      const mStr = getArgentinaDateString(new Date(row.created_at)).slice(0, 7)
      if (mStr in counts) counts[mStr]++
    }

    return months.map((m) => ({ periodo: m, count: counts[m] }))
  }

  throw new AppError('periodo debe ser "mes" o "semana"', 400)
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
