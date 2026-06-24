import { uploadLogo, uploadBanner } from '../services/upload.service.js'
import { AppError } from '../utils/AppError.js'

const ALLOWED_BANNER_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export async function upload(req, res) {
  const file = req.file
  if (!file) throw new AppError('No se recibió ningún archivo', 400)

  const { tipo } = req.query

  let url
  if (tipo === 'logo') {
    if (file.mimetype !== 'image/svg+xml') {
      throw new AppError('El logo debe ser un archivo SVG (image/svg+xml)', 400)
    }
    url = await uploadLogo(file)
  } else if (tipo === 'banner') {
    if (!ALLOWED_BANNER_TYPES.includes(file.mimetype)) {
      throw new AppError('El banner debe ser PNG, JPG, WebP o SVG', 400)
    }
    url = await uploadBanner(file)
  } else {
    throw new AppError('El query param "tipo" debe ser "logo" o "banner"', 400)
  }

  res.json({ url })
}
