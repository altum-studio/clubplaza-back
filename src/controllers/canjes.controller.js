import * as canjesService from '../services/canjes.service.js'
import { AppError } from '../utils/AppError.js'
import { ROLES } from '../constants/roles.js'
import { resolveLocalId } from '../utils/access.js'

export async function create(req, res) {
  const { codigo, usuario_id, promo_id, local_id: bodyLocalId } = req.body
  const { profile } = req.auth

  if (!promo_id) throw new AppError('promo_id es requerido', 400)
  if (!codigo && !usuario_id) throw new AppError('codigo o usuario_id es requerido', 400)

  const isAdmin = profile.rol === ROLES.ADMIN
  const actorLocalId = resolveLocalId(req, bodyLocalId)

  if (!isAdmin && !actorLocalId) {
    throw new AppError('No tenés permisos para registrar canjes', 403)
  }

  const canje = await canjesService.registerCanje({
    codigo,
    usuario_id,
    promo_id,
    actorLocalId,
    isAdmin,
  })

  res.status(201).json(canje)
}

export async function list(req, res) {
  const { local_id, promo_id, desde, hasta, estado, limit, offset } = req.query

  const result = await canjesService.listCanjes({
    local_id,
    promo_id,
    desde,
    hasta,
    estado,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json(result)
}

export async function listMine(req, res) {
  const localId = resolveLocalId(req, req.query.local_id)
  const { desde, hasta, estado, limit, offset } = req.query

  const result = await canjesService.listCanjes({
    local_id: localId,
    desde,
    hasta,
    estado,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json(result)
}

export async function stats(req, res) {
  const { local_id } = req.query
  const result = await canjesService.getCanjesStats({ local_id })
  res.json(result)
}

export async function statsMine(req, res) {
  const localId = resolveLocalId(req, req.query.local_id)
  const result = await canjesService.getCanjesStats({ local_id: localId })
  res.json(result)
}
