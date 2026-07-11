import * as usuariosService from '../services/usuarios.service.js'
import { assertRequiredProfileFields, pickAllowedFields, USUARIO_SELF_UPDATE_FIELDS } from '../constants/usuario.js'
import { AppError } from '../utils/AppError.js'

export async function list(req, res) {
  const { rol, local_id, limit, offset } = req.query
  const result = await usuariosService.listUsuarios({
    rol,
    local_id,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  })
  res.json(result)
}

export async function getById(req, res) {
  const usuario = await usuariosService.getUsuarioById(req.params.id)
  res.json(usuario)
}

export async function create(req, res) {
  const {
    email,
    password,
    nombre,
    apellido,
    fecha_nacimiento,
    dni,
    telefono,
    rol,
    local_id,
    local_ids,
  } = req.body

  const missingFields = assertRequiredProfileFields({
    nombre,
    apellido,
    fecha_nacimiento,
    email,
    dni,
    telefono,
  })

  if (!password || !rol) {
    throw new AppError('password y rol son requeridos', 400)
  }

  if (missingFields) {
    throw new AppError(`Campos requeridos: ${missingFields.join(', ')}`, 400)
  }

  const usuario = await usuariosService.createUsuario({
    email,
    password,
    nombre,
    apellido,
    fecha_nacimiento,
    dni,
    telefono,
    rol,
    local_id,
    local_ids,
  })

  res.status(201).json(usuario)
}

export async function update(req, res) {
  const usuario = await usuariosService.updateUsuario(req.params.id, req.body)
  res.json(usuario)
}

export async function remove(req, res) {
  const result = await usuariosService.deleteUsuario(req.params.id)
  res.json(result)
}

export async function updateMe(req, res) {
  const updates = pickAllowedFields(req.body, USUARIO_SELF_UPDATE_FIELDS)

  if (Object.keys(updates).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', 400)
  }

  const usuario = await usuariosService.updateUsuario(req.auth.profile.id, updates)
  res.json(usuario)
}

export async function getAltas(req, res) {
  const { periodo } = req.query
  const result = await usuariosService.getAltasStats(periodo)
  res.json(result)
}

export async function getByCodigo(req, res) {
  const miembro = await usuariosService.getMiembroByCodigo(req.params.codigo)

  if (!miembro.activo) {
    throw new AppError('Miembro inactivo', 409)
  }

  res.json(miembro)
}
