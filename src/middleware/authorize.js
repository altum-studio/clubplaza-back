import { AppError } from '../utils/AppError.js'

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    const role = req.auth?.profile?.rol

    if (!role) {
      return next(new AppError('No autenticado', 401))
    }

    if (!allowedRoles.includes(role)) {
      return next(new AppError('No tenés permisos para esta acción', 403))
    }

    next()
  }
}

export function authorizeLocalOwnership(getLocalId) {
  return (req, _res, next) => {
    const { profile } = req.auth

    if (profile.rol === 'admin') {
      return next()
    }

    if (profile.rol !== 'local') {
      return next(new AppError('No tenés permisos para esta acción', 403))
    }

    const localId = getLocalId(req)
    if (!(profile.local_ids ?? []).includes(localId)) {
      return next(new AppError('Solo podés gestionar tu propio local', 403))
    }

    next()
  }
}
