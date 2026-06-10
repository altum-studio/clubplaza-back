export const USUARIO_PROFILE_FIELDS = [
  'nombre',
  'apellido',
  'fecha_nacimiento',
  'email',
  'dni',
  'telefono',
]

export const USUARIO_UPDATE_FIELDS = [
  'nombre',
  'apellido',
  'fecha_nacimiento',
  'dni',
  'telefono',
  'rol',
  'local_id',
  'activo',
]

export const USUARIO_SELF_UPDATE_FIELDS = [
  'nombre',
  'apellido',
  'fecha_nacimiento',
  'telefono',
]

export function pickAllowedFields(payload, allowedFields) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedFields.includes(key))
  )
}

export function assertRequiredProfileFields(payload) {
  const missing = USUARIO_PROFILE_FIELDS.filter((field) => !payload[field])

  if (missing.length > 0) {
    return missing
  }

  return null
}
