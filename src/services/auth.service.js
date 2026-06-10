import { supabaseAuth, supabaseAdmin } from '../config/supabase.js'
import { ROLES } from '../constants/roles.js'
import { AppError } from '../utils/AppError.js'
import { sendWelcomeEmail } from './email.service.js'

export async function register({ email, password, nombre, apellido, rol = ROLES.COMUN, local_id = null }) {
  if (rol !== ROLES.COMUN && rol !== ROLES.LOCAL && rol !== ROLES.ADMIN) {
    throw new AppError('Rol inválido', 400)
  }

  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email,
    password,
  })

  if (authError) {
    throw new AppError(authError.message, 400)
  }

  const userId = authData.user?.id
  if (!userId) {
    throw new AppError('No se pudo crear el usuario', 500)
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('usuarios')
    .insert({
      id: userId,
      email,
      nombre,
      apellido,
      rol,
      local_id,
    })
    .select()
    .single()

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw new AppError('No se pudo crear el perfil del usuario', 500, profileError)
  }

  await sendWelcomeEmail({ to: email, nombre }).catch((err) => {
    console.warn('Email de bienvenida no enviado:', err.message)
  })

  return {
    user: authData.user,
    session: authData.session,
    profile,
  }
}

export async function login({ email, password }) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new AppError('Credenciales inválidas', 401)
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    throw new AppError('Perfil de usuario no encontrado', 404)
  }

  return {
    user: data.user,
    session: data.session,
    profile,
  }
}

export async function getSessionProfile(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw new AppError('Perfil de usuario no encontrado', 404)
  }

  return profile
}

export async function refreshSession(refreshToken) {
  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken })

  if (error) {
    throw new AppError('No se pudo refrescar la sesión', 401)
  }

  return data.session
}
