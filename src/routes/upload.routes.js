import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as uploadController from '../controllers/upload.controller.js'

const router = Router()

// Almacena en memoria (buffer) para pasarlo directamente a Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // máx 2 MB (el logo tiene límite menor en el servicio)
})

// POST /api/upload?tipo=logo|banner
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.LOCAL),
  upload.single('file'),
  asyncHandler(uploadController.upload)
)

export default router
