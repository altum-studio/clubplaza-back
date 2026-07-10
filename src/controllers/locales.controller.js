import * as localesService from '../services/locales.service.js'
import { resolveImageUrl } from '../services/upload.service.js'
import { AppError } from '../utils/AppError.js'
import { canViewInactiveLocal, resolveActiveFilter } from '../utils/access.js'
import { validateRubro, validateHorarios } from '../utils/validators.js'

export async function list(req, res) {
  const { limit, offset } = req.query
  const activo = resolveActiveFilter(req, req.query.activo)

  const result = await localesService.listLocales({
    activo,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })
  res.json(result)
}

export async function getById(req, res) {
  const local = await localesService.getLocalById(req.params.id)

  if (!canViewInactiveLocal(req, local)) {
    throw new AppError('Local no encontrado', 404)
  }

  res.json(local)
}

async function resolveLocalImages(body) {
  const resolved = { ...body }

  if (body.logo_url !== undefined) {
    resolved.logo_url = await resolveImageUrl(body.logo_url, 'logos')
  }
  if (body.banner_url !== undefined) {
    resolved.banner_url = await resolveImageUrl(body.banner_url, 'banners')
  }

  return resolved
}

function validateLocalPayload({ nombre, nro_local, rubro, horarios }, { requireAll = false } = {}) {
  if (requireAll || nombre !== undefined) {
    if (!nombre?.trim()) throw new AppError('nombre es requerido', 400)
  }

  if (requireAll || nro_local !== undefined) {
    if (!nro_local?.trim()) throw new AppError('nro_local es requerido', 400)
  }

  if (requireAll || rubro !== undefined) {
    validateRubro(rubro)
  }

  if (horarios !== undefined) {
    validateHorarios(horarios)
  }
}

export async function create(req, res) {
  const { nombre, nro_local, rubro, descripcion, logo_url, banner_url, horarios, activo } = req.body

  validateLocalPayload({ nombre, nro_local, rubro, horarios }, { requireAll: true })

  const local = await localesService.createLocal({
    nombre: nombre.trim(),
    nro_local: nro_local.trim(),
    rubro,
    descripcion: descripcion ?? null,
    logo_url: await resolveImageUrl(logo_url, 'logos'),
    banner_url: await resolveImageUrl(banner_url, 'banners'),
    horarios: horarios ?? null,
    activo: activo ?? true,
  })

  res.status(201).json(local)
}

export async function getMias(req, res) {
  const locales = await localesService.getLocalesByUserId(req.auth.profile.id)
  res.json(locales)
}

export async function update(req, res) {
  const { profile } = req.auth

  if (profile.rol === 'local' && !(profile.local_ids ?? []).includes(req.params.id)) {
    throw new AppError('Solo podés actualizar tu propio local', 403)
  }

  const body = await resolveLocalImages(req.body)

  if (body.nombre !== undefined) body.nombre = body.nombre.trim()
  if (body.nro_local !== undefined) body.nro_local = body.nro_local.trim()

  validateLocalPayload(body)

  const local = await localesService.updateLocal(req.params.id, body)
  res.json(local)
}

export async function remove(req, res) {
  const result = await localesService.deleteLocal(req.params.id)
  res.json(result)
}

export async function getMine(req, res) {
  const { local_id: localId } = req.auth.profile

  if (!localId) {
    throw new AppError('Tu usuario no tiene un local asignado', 404)
  }

  const local = await localesService.getLocalById(localId)
  res.json(local)
}

export async function updateMine(req, res) {
  const { local_id: localId } = req.auth.profile

  if (!localId) {
    throw new AppError('Tu usuario no tiene un local asignado', 404)
  }

  const body = await resolveLocalImages(req.body)

  if (body.nombre !== undefined) body.nombre = body.nombre.trim()
  if (body.nro_local !== undefined) body.nro_local = body.nro_local.trim()

  validateLocalPayload(body)

  const local = await localesService.updateLocal(localId, body)
  res.json(local)
}
