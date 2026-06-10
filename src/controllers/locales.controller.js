import * as localesService from '../services/locales.service.js'
import { AppError } from '../utils/AppError.js'

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
  const { nombre, descripcion, piso, logo_url, activo } = req.body

  if (!nombre) {
    throw new AppError('nombre es requerido', 400)
  }

  const local = await localesService.createLocal({
    nombre,
    descripcion,
    piso,
    logo_url,
    activo: activo ?? true,
  })

  res.status(201).json(local)
}

export async function update(req, res) {
  const { profile } = req.auth

  if (profile.rol === 'local' && profile.local_id !== req.params.id) {
    throw new AppError('Solo podés actualizar tu propio local', 403)
  }

  const local = await localesService.updateLocal(req.params.id, req.body)
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

  const local = await localesService.updateLocal(localId, req.body)
  res.json(local)
}
