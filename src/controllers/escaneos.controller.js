import * as escaneosService from '../services/escaneos.service.js'
import { AppError } from '../utils/AppError.js'
import { resolveLocalId } from '../utils/access.js'

export async function create(req, res) {
  const { codigo, local_id: bodyLocalId } = req.body

  if (!codigo?.trim()) {
    throw new AppError('codigo es requerido', 400)
  }

  const result = await escaneosService.registerEscaneo({
    codigo,
    localId: resolveLocalId(req, bodyLocalId),
  })

  res.status(201).json(result)
}

export async function listMine(req, res) {
  const { desde, hasta, limit, offset, local_id: queryLocalId } = req.query

  const result = await escaneosService.listEscaneos({
    local_id: resolveLocalId(req, queryLocalId),
    desde,
    hasta,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json(result)
}
