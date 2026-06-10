import * as usuariosService from '../services/usuarios.service.js'
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
  const { email, password, nombre, apellido, rol, local_id } = req.body

  if (!email || !password || !nombre || !apellido || !rol) {
    throw new AppError('email, password, nombre, apellido y rol son requeridos', 400)
  }

  const usuario = await usuariosService.createUsuario({
    email,
    password,
    nombre,
    apellido,
    rol,
    local_id,
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
  const allowedFields = ['nombre', 'apellido']
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  )

  const usuario = await usuariosService.updateUsuario(req.auth.profile.id, updates)
  res.json(usuario)
}
