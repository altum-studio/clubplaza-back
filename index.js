import { env } from './src/config/env.js'
import { createApp } from './src/app.js'

const app = createApp()

app.listen(env.port, () => {
  console.log(`Club Plaza API escuchando en puerto ${env.port}`)
})
