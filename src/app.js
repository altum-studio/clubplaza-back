import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { swaggerSpec } from './swagger.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'clubplaza-back' })
  })

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  app.use('/api', apiRouter)

  app.use(errorHandler)

  return app
}
