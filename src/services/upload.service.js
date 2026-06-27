import { supabaseAdmin } from '../config/supabase.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

const LOGO_MAX_BYTES = 512 * 1024 // 512 KB
const BANNER_MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const BANNER_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']

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

function isSvgText(value) {
  const trimmed = value.trimStart()
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Acepta URLs generadas por POST /api/upload en el bucket correspondiente. */
export function isStorageUrl(value, bucket) {
  if (!value || typeof value !== 'string') return false

  const base = escapeRegex(env.supabase.url)
  const pattern = new RegExp(`^${base}/storage/v1/object/public/${bucket}/`)
  return pattern.test(value)
}

async function uploadBuffer(buffer, bucket, contentType, filename) {
  const maxBytes = bucket === 'logos' ? LOGO_MAX_BYTES : BANNER_MAX_BYTES
  const maxLabel = bucket === 'logos' ? '512 KB' : '2 MB'

  if (buffer.length > maxBytes) {
    throw new AppError(`La imagen no puede superar ${maxLabel}`, 400)
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, buffer, { contentType, upsert: false })

  if (error) throw new AppError('No se pudo subir la imagen', 500, error)

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename)
  return data.publicUrl
}

/**
 * Sube SVG/imagen embebida o acepta URL del bucket propio.
 * Rechaza URLs externas pegadas manualmente.
 */
export async function resolveImageUrl(value, bucket) {
  if (!value) return null

  if (bucket === 'logos') {
    if (isSvgText(value)) {
      const buffer = sanitizeSvg(Buffer.from(value, 'utf8'))
      return uploadBuffer(buffer, bucket, 'image/svg+xml', safeFilename('upload.svg'))
    }

    if (value.startsWith('data:image/svg+xml,')) {
      const svgContent = decodeURIComponent(value.slice('data:image/svg+xml,'.length))
      const buffer = sanitizeSvg(Buffer.from(svgContent, 'utf8'))
      return uploadBuffer(buffer, bucket, 'image/svg+xml', safeFilename('upload.svg'))
    }

    if (value.startsWith('data:')) {
      const match = value.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) throw new AppError('Formato de imagen inválido', 400)

      const [, mimeType, b64] = match
      if (mimeType !== 'image/svg+xml') {
        throw new AppError('El logo debe ser un archivo SVG (image/svg+xml)', 400)
      }

      const buffer = sanitizeSvg(Buffer.from(b64, 'base64'))
      return uploadBuffer(buffer, bucket, mimeType, safeFilename('upload.svg'))
    }

    if (isStorageUrl(value, bucket)) return value

    throw new AppError(
      'logo_url debe ser un SVG subido o la URL devuelta por POST /api/upload?tipo=logo',
      400
    )
  }

  // banners
  if (value.startsWith('data:')) {
    const match = value.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) throw new AppError('Formato de imagen inválido', 400)

    const [, mimeType, b64] = match
    if (!BANNER_MIME_TYPES.includes(mimeType)) {
      throw new AppError('El banner debe ser PNG, JPG o WebP', 400)
    }

    const buffer = Buffer.from(b64, 'base64')
    const ext = mimeType.split('/')[1].replace('jpeg', 'jpg')
    return uploadBuffer(buffer, bucket, mimeType, safeFilename(`upload.${ext}`))
  }

  if (isStorageUrl(value, bucket)) return value

  throw new AppError(
    'banner_url debe ser una imagen subida o la URL devuelta por POST /api/upload?tipo=banner',
    400
  )
}

export async function uploadLogo(file) {
  if (file.size > LOGO_MAX_BYTES) {
    throw new AppError('El logo no puede superar 512 KB', 400)
  }

  const buffer = sanitizeSvg(file.buffer)
  return uploadBuffer(buffer, 'logos', 'image/svg+xml', safeFilename(file.originalname))
}

export async function uploadBanner(file) {
  if (file.size > BANNER_MAX_BYTES) {
    throw new AppError('El banner no puede superar 2 MB', 400)
  }

  if (!BANNER_MIME_TYPES.includes(file.mimetype)) {
    throw new AppError('El banner debe ser PNG, JPG o WebP', 400)
  }

  return uploadBuffer(file.buffer, 'banners', file.mimetype, safeFilename(file.originalname))
}
