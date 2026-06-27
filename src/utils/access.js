import { ROLES } from '../constants/roles.js'

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
  if (req.auth?.profile?.rol === ROLES.LOCAL && req.auth.profile.local_id === local.id) return true
  return false
}

export function canViewInactivePromo(req, promo) {
  if (promo.activa !== false) return true
  if (isAdmin(req)) return true
  if (req.auth?.profile?.rol === ROLES.LOCAL && req.auth.profile.local_id === promo.local_id) return true
  return false
}
