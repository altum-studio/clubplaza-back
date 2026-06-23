import * as localesService from '../services/locales.service.js'
import { resolveImageUrl } from '../services/upload.service.js'
import { AppError } from '../utils/AppError.js'
import { RUBROS } from '../constants/enums.js'

export async function list(req, res) {
  const { activo, limit, offset } = req.query
  const result = await localesService.listLocales({
    activo,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })
  res.json(result)
}

export async function getById(req, res) {
  const local = await localesService.getLocalById(req.params.id)
  res.json(local)
}

export async function create(req, res) {
  const { nombre, nro_local, rubro, descripcion, logo_url, banner_url, horarios, activo } = req.body

  if (!nombre?.trim()) throw new AppError('nombre es requerido', 400)
  if (!rubro) throw new AppError('rubro es requerido', 400)
  if (!RUBROS.includes(rubro)) throw new AppError(`rubro inválido. Opciones: ${RUBROS.join(', ')}`, 400)

  const local = await localesService.createLocal({
    nombre: nombre.trim(),
    nro_local: nro_local ?? null,
    rubro,
    descripcion: descripcion ?? null,
    logo_url: await resolveImageUrl(logo_url, 'logos'),
    banner_url: await resolveImageUrl(banner_url, 'banners'),
    horarios: horarios ?? null,
    activo: activo ?? true,
  })

  res.status(201).json(local)
}

export async function update(req, res) {
  const { profile } = req.auth

  if (profile.rol === 'local' && profile.local_id !== req.params.id) {
    throw new AppError('Solo podés actualizar tu propio local', 403)
  }

  const body = { ...req.body }
  if (body.logo_url) body.logo_url = await resolveImageUrl(body.logo_url, 'logos')
  if (body.banner_url) body.banner_url = await resolveImageUrl(body.banner_url, 'banners')

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

  const body = { ...req.body }
  if (body.logo_url) body.logo_url = await resolveImageUrl(body.logo_url, 'logos')
  if (body.banner_url) body.banner_url = await resolveImageUrl(body.banner_url, 'banners')

  const local = await localesService.updateLocal(localId, body)
  res.json(local)
}
