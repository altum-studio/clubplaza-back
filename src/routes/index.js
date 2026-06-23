import { Router } from 'express'
import authRoutes from './auth.routes.js'
import usuariosRoutes from './usuarios.routes.js'
import localesRoutes from './locales.routes.js'
import promosRoutes from './promos.routes.js'
import uploadRoutes from './upload.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRoutes)
apiRouter.use('/usuarios', usuariosRoutes)
apiRouter.use('/locales', localesRoutes)
apiRouter.use('/promos', promosRoutes)
apiRouter.use('/upload', uploadRoutes)
