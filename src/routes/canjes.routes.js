import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as canjesController from '../controllers/canjes.controller.js'

const router = Router()

router.use(authenticate)

router.get('/stats/mine', authorize(ROLES.LOCAL), asyncHandler(canjesController.statsMine))
router.get('/stats', authorize(ROLES.ADMIN), asyncHandler(canjesController.stats))
router.get('/mine', authorize(ROLES.LOCAL), asyncHandler(canjesController.listMine))
router.get('/', authorize(ROLES.ADMIN), asyncHandler(canjesController.list))
router.post('/', authorize(ROLES.ADMIN, ROLES.LOCAL), asyncHandler(canjesController.create))

export default router
