import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as localesController from '../controllers/locales.controller.js'

const router = Router()

router.get('/', optionalAuthenticate, asyncHandler(localesController.list))
router.get('/mias', authenticate, authorize(ROLES.LOCAL), asyncHandler(localesController.getMias))
router.get('/mine/mi-local', authenticate, authorize(ROLES.LOCAL), asyncHandler(localesController.getMine))
router.patch('/mine/mi-local', authenticate, authorize(ROLES.LOCAL), asyncHandler(localesController.updateMine))
router.post('/', authenticate, authorize(ROLES.ADMIN), asyncHandler(localesController.create))
router.get('/:id', optionalAuthenticate, asyncHandler(localesController.getById))
router.patch('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.LOCAL), asyncHandler(localesController.update))
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(localesController.remove))

export default router
