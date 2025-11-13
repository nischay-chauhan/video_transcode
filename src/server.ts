import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { AuthService } from './services/auth'
import { initializeWorker } from './services/queue'
import { videoQueue } from './config/redis'
import { WebSocket, WebSocketServer } from 'ws'
import { createServer, IncomingMessage, Server as HttpServer } from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { videoRouter } from './routes/video'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = new Hono()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const server = createServer()

const wss = new WebSocketServer({ noServer: true })
const clients = new Map<string, WebSocket>()

// WebSocket connection handling moved to upgrade handler

const authenticateToken = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const decoded = AuthService.verifyToken(token)
  
  if (!decoded) {
    return c.json({ error: 'Invalid or expired token' }, 403)
  }

  c.set('user', decoded)
  await next()
}

app.use('*', cors())

const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use('/uploads/*', async (c) => {
  return new Response(null, {
    status: 404,
    statusText: 'Not Found'
  })
})

app.get('/health', (c) => c.json({ status: 'ok' }))

app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    // In a real app, validate against a database
    if (username === 'admin' && password === 'password') {
      const user = {
        id: '1',
        username,
        role: 'admin' as const
      }
      const token = AuthService.generateToken(user)
      return c.json({ token, user })
    } else {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

const apiRoutes = new Hono()

apiRoutes.use('*', authenticateToken)
apiRoutes.route('/videos', videoRouter)

app.route('/api', apiRoutes)

app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

initializeWorker()

// Handle HTTP requests
server.on('request', (req: IncomingMessage, res) => {
  app.fetch(req as any, res as any, {} as any)
})

// Handle WebSocket upgrade
server.on('upgrade', (request: IncomingMessage, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    const token = request.headers.authorization?.split(' ')[1]
    if (!token) {
      ws.close(1008, 'Authentication required')
      return
    }

    const decoded = AuthService.verifyToken(token)
    if (!decoded) {
      ws.close(1008, 'Invalid or expired token')
      return
    }

    const clientId = decoded.id
    clients.set(clientId, ws as WebSocket)

    ws.on('message', (message) => {
      console.log('Received:', message.toString())
      // Handle WebSocket messages here
    })

    ws.on('close', () => {
      console.log('Client disconnected:', clientId)
      clients.delete(clientId)
    })
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  await videoQueue.close()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export { app }
