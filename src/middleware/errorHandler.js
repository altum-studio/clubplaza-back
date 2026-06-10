import { AppError } from '../utils/AppError.js'

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    })
  }

  console.error(err)

  return res.status(500).json({
    error: 'Error interno del servidor',
  })
}
