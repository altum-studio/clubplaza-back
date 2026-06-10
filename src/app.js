import express from 'express'
import cors from 'cors'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'clubplaza-back' })
  })

  app.use('/api', apiRouter)

  app.use(errorHandler)

  return app
}
