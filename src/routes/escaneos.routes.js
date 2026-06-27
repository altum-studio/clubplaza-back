import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as escaneosController from '../controllers/escaneos.controller.js'

const router = Router()

router.use(authenticate)

router.get('/mine', authorize(ROLES.LOCAL), asyncHandler(escaneosController.listMine))
router.post('/', authorize(ROLES.LOCAL), asyncHandler(escaneosController.create))

export default router
