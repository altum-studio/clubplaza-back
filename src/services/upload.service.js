import { supabaseAdmin } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'

const LOGO_MAX_BYTES = 512 * 1024 // 512 KB
const BANNER_MAX_BYTES = 2 * 1024 * 1024 // 2 MB

function sanitizeSvg(buffer) {
  let svg = buffer.toString('utf8')
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '')
  svg = svg.replace(/\s+on\w+="[^"]*"/gi, '')
  svg = svg.replace(/\s+on\w+='[^']*'/gi, '')
  return Buffer.from(svg, 'utf8')
}

function safeFilename(original) {
  return `${Date.now()}-${original.replace(/[^a-z0-9._-]/gi, '_')}`
}

/**
 * Si el valor es un data URI base64, lo sube al bucket indicado y devuelve la URL pública.
 * Si ya es una URL (o null), lo devuelve sin tocar.
 */
export async function resolveImageUrl(value, bucket) {
  if (!value || !value.startsWith('data:')) return value ?? null

  const match = value.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new AppError('Formato de imagen inválido', 400)

  const [, mimeType, b64] = match
  const buffer = Buffer.from(b64, 'base64')

  const maxBytes = bucket === 'logos' ? LOGO_MAX_BYTES : BANNER_MAX_BYTES
  const maxLabel = bucket === 'logos' ? '512 KB' : '2 MB'
  if (buffer.length > maxBytes) throw new AppError(`La imagen no puede superar ${maxLabel}`, 400)

  const finalBuffer = mimeType === 'image/svg+xml' ? sanitizeSvg(buffer) : buffer
  const ext = mimeType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
  const filename = safeFilename(`upload.${ext}`)

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, finalBuffer, { contentType: mimeType, upsert: false })

  if (error) throw new AppError('No se pudo subir la imagen', 500, error)

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename)
  return data.publicUrl
}

export async function uploadLogo(file) {
  if (file.size > LOGO_MAX_BYTES) {
    throw new AppError('El logo no puede superar 512 KB', 400)
  }

  const buffer = sanitizeSvg(file.buffer)
  const filename = safeFilename(file.originalname)

  const { error } = await supabaseAdmin.storage
    .from('logos')
    .upload(filename, buffer, { contentType: 'image/svg+xml', upsert: false })

  if (error) throw new AppError('No se pudo subir el logo', 500, error)

  const { data } = supabaseAdmin.storage.from('logos').getPublicUrl(filename)
  return data.publicUrl
}

export async function uploadBanner(file) {
  if (file.size > BANNER_MAX_BYTES) {
    throw new AppError('El banner no puede superar 2 MB', 400)
  }

  const filename = safeFilename(file.originalname)

  const { error } = await supabaseAdmin.storage
    .from('banners')
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false })

  if (error) throw new AppError('No se pudo subir el banner', 500, error)

  const { data } = supabaseAdmin.storage.from('banners').getPublicUrl(filename)
  return data.publicUrl
}
