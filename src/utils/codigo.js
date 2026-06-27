import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from './AppError.js'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const MAX_ATTEMPTS = 15

export function generateMemberCode(length = CODE_LENGTH) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

export function normalizeCodigo(codigo) {
  return codigo?.trim().toUpperCase() ?? ''
}

export async function generateUniqueMemberCode() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const codigo = generateMemberCode()
    const { data } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('codigo', codigo)
      .maybeSingle()

    if (!data) return codigo
  }

  throw new AppError('No se pudo generar un código de miembro único', 500)
}
