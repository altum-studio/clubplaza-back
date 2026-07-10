import * as promosService from '../services/promos.service.js'
import { getLocalById } from '../services/locales.service.js'
import { resolveImageUrl } from '../services/upload.service.js'
import { AppError } from '../utils/AppError.js'
import { canViewInactivePromo, resolveActiveFilter, resolveLocalId } from '../utils/access.js'
import { validatePromoFields } from '../utils/validators.js'

export async function list(req, res) {
  const { local_id, rubro, limit, offset } = req.query
  const activa = resolveActiveFilter(req, req.query.activa)

  const result = await promosService.listPromos({
    local_id,
    activa,
    rubro,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })
  res.json(result)
}

export async function getById(req, res) {
  const promo = await promosService.getPromoById(req.params.id)

  if (!canViewInactivePromo(req, promo)) {
    throw new AppError('Promo no encontrada', 404)
  }

  res.json(promo)
}

async function buildPromoPayload(body, localId) {
  const local = await getLocalById(localId)

  const {
    titulo,
    tipo,
    valor,
    precio_anterior,
    precio_nuevo,
    descripcion,
    dias,
    vigencia_desde,
    vigencia_hasta,
    limite_cantidad,
    limite_periodo,
    banner_url,
    activa,
  } = body

  validatePromoFields({
    tipo,
    valor,
    precio_anterior,
    precio_nuevo,
    dias,
    vigencia_desde,
    vigencia_hasta,
    limite_cantidad,
    limite_periodo,
  })

  return {
    local_id: localId,
    rubro: local.rubro,
    titulo: titulo.trim(),
    tipo,
    valor: valor ?? null,
    precio_anterior: precio_anterior ?? null,
    precio_nuevo: precio_nuevo ?? null,
    descripcion: descripcion ?? null,
    dias,
    vigencia_desde,
    vigencia_hasta,
    limite_cantidad: limite_cantidad ?? null,
    limite_periodo: limite_periodo ?? 'ilimitado',
    banner_url: await resolveImageUrl(banner_url, 'banners'),
    activa: activa ?? true,
  }
}

export async function create(req, res) {
  const { local_id: bodyLocalId, titulo } = req.body
  const localId = resolveLocalId(req, bodyLocalId)

  if (!localId) throw new AppError('local_id es requerido', 400)
  if (!titulo?.trim()) throw new AppError('titulo es requerido', 400)

  const payload = await buildPromoPayload(req.body, localId)
  const promo = await promosService.createPromo(payload)

  res.status(201).json(promo)
}

async function assertPromoOwnership(req) {
  const { profile } = req.auth

  if (profile.rol !== 'local') return

  const promo = await promosService.getPromoById(req.params.id)

  if (!(profile.local_ids ?? []).includes(promo.local_id)) {
    throw new AppError('Solo podés gestionar promos de tu local', 403)
  }
}

async function buildPromoUpdatePayload(body, currentPromo) {
  const merged = {
    titulo: body.titulo ?? currentPromo.titulo,
    tipo: body.tipo ?? currentPromo.tipo,
    valor: body.valor !== undefined ? body.valor : currentPromo.valor,
    precio_anterior: body.precio_anterior !== undefined ? body.precio_anterior : currentPromo.precio_anterior,
    precio_nuevo: body.precio_nuevo !== undefined ? body.precio_nuevo : currentPromo.precio_nuevo,
    descripcion: body.descripcion !== undefined ? body.descripcion : currentPromo.descripcion,
    dias: body.dias ?? currentPromo.dias,
    vigencia_desde: body.vigencia_desde ?? currentPromo.vigencia_desde,
    vigencia_hasta: body.vigencia_hasta ?? currentPromo.vigencia_hasta,
    limite_cantidad: body.limite_cantidad !== undefined ? body.limite_cantidad : currentPromo.limite_cantidad,
    limite_periodo: body.limite_periodo !== undefined ? body.limite_periodo : currentPromo.limite_periodo,
    activa: body.activa !== undefined ? body.activa : currentPromo.activa,
  }

  validatePromoFields(merged)

  const updates = { ...body }
  delete updates.rubro

  if (body.titulo !== undefined) updates.titulo = body.titulo.trim()
  if (body.local_id !== undefined) {
    const local = await getLocalById(body.local_id)
    updates.local_id = body.local_id
    updates.rubro = local.rubro
  }

  if (body.banner_url !== undefined) {
    updates.banner_url = await resolveImageUrl(body.banner_url, 'banners')
  }

  return updates
}

export async function update(req, res) {
  await assertPromoOwnership(req)

  const currentPromo = await promosService.getPromoById(req.params.id)
  const updates = await buildPromoUpdatePayload(req.body, currentPromo)

  const promo = await promosService.updatePromo(req.params.id, updates)
  res.json(promo)
}

export async function remove(req, res) {
  await assertPromoOwnership(req)
  const result = await promosService.deletePromo(req.params.id)
  res.json(result)
}

export async function createMine(req, res) {
  const localId = resolveLocalId(req, req.body.local_id)

  if (!req.body.titulo?.trim()) throw new AppError('titulo es requerido', 400)

  const payload = await buildPromoPayload(req.body, localId)
  const promo = await promosService.createPromo(payload)

  res.status(201).json(promo)
}

export async function listMine(req, res) {
  const localId = resolveLocalId(req, req.query.local_id)

  const { activa, limit, offset } = req.query
  const result = await promosService.listPromos({
    local_id: localId,
    activa: activa !== undefined ? (activa === true || activa === 'true') : undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json(result)
}
