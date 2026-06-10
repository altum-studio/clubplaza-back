import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as promosController from '../controllers/promos.controller.js'

const router = Router()

router.get('/', optionalAuthenticate, asyncHandler(promosController.list))
router.get('/mine/mis-promos', authenticate, authorize(ROLES.LOCAL), asyncHandler(promosController.listMine))
router.post('/mine/mis-promos', authenticate, authorize(ROLES.LOCAL), asyncHandler(promosController.createMine))
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.LOCAL), asyncHandler(promosController.create))
router.get('/:id', optionalAuthenticate, asyncHandler(promosController.getById))
router.patch('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.LOCAL), asyncHandler(promosController.update))
router.delete('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.LOCAL), asyncHandler(promosController.remove))

export default router
