import { ROLES } from '../constants/roles.js'
import { AppError } from './AppError.js'

export function isAdmin(req) {
  return req.auth?.profile?.rol === ROLES.ADMIN
}

/** Por defecto solo activos para público/comun; admin y local ven todos en listados generales. */
export function resolveActiveFilter(req, queryValue) {
  const role = req.auth?.profile?.rol

  if (!role || role === ROLES.COMUN) return true

  if (queryValue !== undefined) {
    return queryValue === true || queryValue === 'true'
  }

  return undefined
}

export function canViewInactiveLocal(req, local) {
  if (local.activo !== false) return true
  if (isAdmin(req)) return true
  if (req.auth?.profile?.rol === ROLES.LOCAL && (req.auth.profile.local_ids ?? []).includes(local.id)) return true
  return false
}

export function canViewInactivePromo(req, promo) {
  if (promo.activa !== false) return true
  if (isAdmin(req)) return true
  if (req.auth?.profile?.rol === ROLES.LOCAL && (req.auth.profile.local_ids ?? []).includes(promo.local_id)) return true
  return false
}

/**
 * Resuelve el local_id activo para un request de usuario local.
 * - Si admin: devuelve el providedLocalId (puede ser null si no lo mandó).
 * - Si local: usa providedLocalId o cae al principal (profile.local_id).
 *   Verifica que el usuario gestione ese local; si no, lanza 403.
 */
export function resolveLocalId(req, providedLocalId) {
  const { profile } = req.auth

  if (profile.rol === ROLES.ADMIN) {
    return providedLocalId ?? null
  }

  const targetLocalId = providedLocalId ?? profile.local_id

  if (!targetLocalId) {
    throw new AppError('Tu usuario no tiene un local asignado', 404)
  }

  if (providedLocalId && !(profile.local_ids ?? []).includes(providedLocalId)) {
    throw new AppError('No gestionás ese local', 403)
  }

  return targetLocalId
}
