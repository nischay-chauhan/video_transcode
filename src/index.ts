import { Hono } from 'hono'
import { videoRouter } from './routes/video'
import { errorHandler } from './middlewares/errorHandler'
import { initializeWorker } from './services/queue'
import dotenv from 'dotenv'

dotenv.config()

// Initialize the worker
const worker = initializeWorker()

const app = new Hono()
const port = parseInt(process.env.PORT || '3001')

app.use('*', errorHandler())
app.route('/api/video', videoRouter)

export default {
  port,
  fetch: app.fetch,
}

console.log(`Server is running on http://localhost:${port}`) 