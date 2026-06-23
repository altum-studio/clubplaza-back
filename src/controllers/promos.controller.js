import * as promosService from '../services/promos.service.js'
import { getLocalById } from '../services/locales.service.js'
import { resolveImageUrl } from '../services/upload.service.js'
import { AppError } from '../utils/AppError.js'
import { TIPOS_BENEFICIO, LIMITE_PERIODO } from '../constants/enums.js'

export async function list(req, res) {
  const { local_id, activa, rubro, limit, offset } = req.query
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
  res.json(promo)
}

const TIPOS_CON_VALOR = ['descuento', 'descuento_fijo', 'cuotas', 'bonificacion']

function validatePromoFields({ tipo, valor, dias, vigencia_desde, vigencia_hasta, limite_cantidad, limite_periodo }) {
  if (!tipo) throw new AppError('tipo es requerido', 400)
  if (!TIPOS_BENEFICIO.includes(tipo)) {
    throw new AppError(`tipo inválido. Opciones: ${TIPOS_BENEFICIO.join(', ')}`, 400)
  }

  if (TIPOS_CON_VALOR.includes(tipo) && (valor === undefined || valor === null)) {
    throw new AppError(`valor es requerido para el tipo "${tipo}"`, 400)
  }

  if (!dias || !Array.isArray(dias) || dias.length === 0) {
    throw new AppError('dias es requerido (al menos un día)', 400)
  }

  // vigencia: ambas null (indefinida) o ambas presentes y válidas
  if (vigencia_desde === null && vigencia_hasta === null) {
    // indefinida, ok
  } else if (vigencia_desde && vigencia_hasta) {
    if (new Date(vigencia_hasta) < new Date(vigencia_desde)) {
      throw new AppError('vigencia_hasta debe ser igual o posterior a vigencia_desde', 400)
    }
  } else if (vigencia_desde || vigencia_hasta) {
    throw new AppError('vigencia_desde y vigencia_hasta deben enviarse juntas o ambas como null', 400)
  }

  if (limite_cantidad != null && !limite_periodo) {
    throw new AppError('limite_periodo es requerido cuando se define limite_cantidad', 400)
  }
  if (limite_periodo && !LIMITE_PERIODO.includes(limite_periodo)) {
    throw new AppError(`limite_periodo inválido. Opciones: ${LIMITE_PERIODO.join(', ')}`, 400)
  }
}

export async function create(req, res) {
  const {
    local_id: bodyLocalId,
    titulo,
    tipo,
    valor,
    descripcion,
    dias,
    vigencia_desde,
    vigencia_hasta,
    limite_cantidad,
    limite_periodo,
    banner_url,
    activa,
  } = req.body

  const { profile } = req.auth
  const localId = profile.rol === 'local' ? profile.local_id : bodyLocalId

  if (!localId) throw new AppError('local_id es requerido', 400)
  if (!titulo) throw new AppError('titulo es requerido', 400)

  if (profile.rol === 'local' && bodyLocalId && bodyLocalId !== profile.local_id) {
    throw new AppError('Solo podés crear promos para tu local', 403)
  }

  validatePromoFields({ tipo, valor, dias, vigencia_desde, vigencia_hasta, limite_cantidad, limite_periodo })

  const local = await getLocalById(localId)

  const promo = await promosService.createPromo({
    local_id: localId,
    rubro: local.rubro,
    titulo: titulo.trim(),
    tipo,
    valor: valor ?? null,
    descripcion: descripcion ?? null,
    dias,
    vigencia_desde: vigencia_desde ?? null,
    vigencia_hasta: vigencia_hasta ?? null,
    limite_cantidad: limite_cantidad ?? null,
    limite_periodo: limite_periodo ?? 'ilimitado',
    banner_url: await resolveImageUrl(banner_url, 'banners'),
    activa: activa ?? true,
  })

  res.status(201).json(promo)
}

async function assertPromoOwnership(req) {
  const { profile } = req.auth

  if (profile.rol !== 'local') return

  const promo = await promosService.getPromoById(req.params.id)

  if (promo.local_id !== profile.local_id) {
    throw new AppError('Solo podés gestionar promos de tu local', 403)
  }
}

export async function update(req, res) {
  await assertPromoOwnership(req)

  const { tipo, limite_periodo } = req.body
  if (tipo && !TIPOS_BENEFICIO.includes(tipo)) {
    throw new AppError(`tipo inválido. Opciones: ${TIPOS_BENEFICIO.join(', ')}`, 400)
  }
  if (limite_periodo && !LIMITE_PERIODO.includes(limite_periodo)) {
    throw new AppError(`limite_periodo inválido. Opciones: ${LIMITE_PERIODO.join(', ')}`, 400)
  }

  const body = { ...req.body }
  if (body.banner_url) body.banner_url = await resolveImageUrl(body.banner_url, 'banners')

  const promo = await promosService.updatePromo(req.params.id, body)
  res.json(promo)
}

export async function remove(req, res) {
  await assertPromoOwnership(req)
  const result = await promosService.deletePromo(req.params.id)
  res.json(result)
}

export async function createMine(req, res) {
  const { local_id: localId } = req.auth.profile

  if (!localId) throw new AppError('Tu usuario no tiene un local asignado', 404)

  const {
    titulo,
    tipo,
    valor,
    descripcion,
    dias,
    vigencia_desde,
    vigencia_hasta,
    limite_cantidad,
    limite_periodo,
    banner_url,
    activa,
  } = req.body

  if (!titulo?.trim()) throw new AppError('titulo es requerido', 400)

  validatePromoFields({ tipo, valor, dias, vigencia_desde, vigencia_hasta, limite_cantidad, limite_periodo })

  const local = await getLocalById(localId)

  const promo = await promosService.createPromo({
    local_id: localId,
    rubro: local.rubro,
    titulo: titulo.trim(),
    tipo,
    valor: valor ?? null,
    descripcion: descripcion ?? null,
    dias,
    vigencia_desde: vigencia_desde ?? null,
    vigencia_hasta: vigencia_hasta ?? null,
    limite_cantidad: limite_cantidad ?? null,
    limite_periodo: limite_periodo ?? 'ilimitado',
    banner_url: await resolveImageUrl(banner_url, 'banners'),
    activa: activa ?? true,
  })

  res.status(201).json(promo)
}

export async function listMine(req, res) {
  const { local_id: localId } = req.auth.profile

  if (!localId) throw new AppError('Tu usuario no tiene un local asignado', 404)

  const { activa, limit, offset } = req.query
  const result = await promosService.listPromos({
    local_id: localId,
    activa,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })

  res.json(result)
}
