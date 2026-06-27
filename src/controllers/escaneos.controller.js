import * as escaneosService from '../services/escaneos.service.js'
import { AppError } from '../utils/AppError.js'

function getLocalId(req) {
  const { local_id: localId } = req.auth.profile

  if (!localId) {
    throw new AppError('Tu usuario no tiene un local asignado', 404)
  }

  return localId
}

export async function create(req, res) {
  const { codigo } = req.body

  if (!codigo?.trim()) {
    throw new AppError('codigo es requerido', 400)
  }

  const result = await escaneosService.registerEscaneo({
    codigo,
    localId: getLocalId(req),
  })

  res.status(201).json(result)
}

export async function listMine(req, res) {
  const { desde, hasta, limit, offset } = req.query

  const result = await escaneosService.listEscaneos({
    local_id: getLocalId(req),
    desde,
    hasta,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json(result)
}
