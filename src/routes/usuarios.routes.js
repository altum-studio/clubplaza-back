import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as usuariosController from '../controllers/usuarios.controller.js'

const router = Router()

router.use(authenticate)

router.patch('/me', asyncHandler(usuariosController.updateMe))

router.get('/codigo/:codigo', authorize(ROLES.ADMIN, ROLES.LOCAL), asyncHandler(usuariosController.getByCodigo))

router.get('/altas', authorize(ROLES.ADMIN), asyncHandler(usuariosController.getAltas))

router.get('/', authorize(ROLES.ADMIN), asyncHandler(usuariosController.list))
router.get('/:id', authorize(ROLES.ADMIN), asyncHandler(usuariosController.getById))
router.post('/', authorize(ROLES.ADMIN), asyncHandler(usuariosController.create))
router.patch('/:id', authorize(ROLES.ADMIN), asyncHandler(usuariosController.update))
router.delete('/:id', authorize(ROLES.ADMIN), asyncHandler(usuariosController.remove))

export default router
