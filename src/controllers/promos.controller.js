import * as promosService from '../services/promos.service.js'
import { AppError } from '../utils/AppError.js'

export async function list(req, res) {
  const { local_id, activa, limit, offset } = req.query
  const result = await promosService.listPromos({
    local_id,
    activa,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })
  res.json(result)
}

export async function getById(req, res) {
  const promo = await promosService.getPromoById(req.params.id)
  res.json(promo)
}

export async function create(req, res) {
  const {
    local_id: bodyLocalId,
    titulo,
    descripcion,
    descuento,
    fecha_inicio,
    fecha_fin,
    imagen_url,
    activa,
  } = req.body

  const { profile } = req.auth
  const localId = profile.rol === 'local' ? profile.local_id : bodyLocalId

  if (!localId || !titulo) {
    throw new AppError('local_id y titulo son requeridos', 400)
  }

  if (profile.rol === 'local' && bodyLocalId && bodyLocalId !== profile.local_id) {
    throw new AppError('Solo podés crear promos para tu local', 403)
  }

  const promo = await promosService.createPromo({
    local_id: localId,
    titulo,
    descripcion,
    descuento,
    fecha_inicio,
    fecha_fin,
    imagen_url,
    activa: activa ?? true,
  })

  res.status(201).json(promo)
}

async function assertPromoOwnership(req) {
  const { profile } = req.auth

  if (profile.rol !== 'local') {
    return
  }

  const promo = await promosService.getPromoById(req.params.id)

  if (promo.local_id !== profile.local_id) {
    throw new AppError('Solo podés gestionar promos de tu local', 403)
  }
}

export async function update(req, res) {
  await assertPromoOwnership(req)
  const promo = await promosService.updatePromo(req.params.id, req.body)
  res.json(promo)
}

export async function remove(req, res) {
  await assertPromoOwnership(req)
  const result = await promosService.deletePromo(req.params.id)
  res.json(result)
}

export async function createMine(req, res) {
  const { local_id: localId } = req.auth.profile
  const { titulo, descripcion, descuento, fecha_inicio, fecha_fin, imagen_url, activa } = req.body

  if (!localId) {
    throw new AppError('Tu usuario no tiene un local asignado', 404)
  }

  if (!titulo) {
    throw new AppError('titulo es requerido', 400)
  }

  const promo = await promosService.createPromo({
    local_id: localId,
    titulo,
    descripcion,
    descuento,
    fecha_inicio,
    fecha_fin,
    imagen_url,
    activa: activa ?? true,
  })

  res.status(201).json(promo)
}

export async function listMine(req, res) {
  const { local_id: localId } = req.auth.profile

  if (!localId) {
    throw new AppError('Tu usuario no tiene un local asignado', 404)
  }

  const { activa, limit, offset } = req.query
  const result = await promosService.listPromos({
    local_id: localId,
    activa,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json(result)
}
