import { supabaseAuth, supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Token de autenticación requerido', 401)
    }

    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)

    if (error || !user) {
      throw new AppError('Token inválido o expirado', 401)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new AppError('Perfil de usuario no encontrado', 404)
    }

    req.auth = {
      token,
      user,
      profile,
    }

    next()
  } catch (error) {
    next(error)
  }
}

export async function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next()
  }

  try {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)

    if (error || !user) {
      return next()
    }

    const { data: profile } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      req.auth = { token, user, profile }
    }

    next()
  } catch {
    next()
  }
}
