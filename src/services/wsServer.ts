import { WebSocket, WebSocketServer } from 'ws'
import { AuthService } from './auth'
import { UserPayload } from '../types/auth'

interface CustomWebSocket extends WebSocket {
  jobId?: string;
  user?: UserPayload;
  upgradeReq: {
    headers: {
      get: (key: string) => string | null;
    };
  };
}

interface WSMessage {
  type: 'progress' | 'status' | 'error'
  jobId: string
  data: any
}

class VideoProcessingWSServer {
  private wss: WebSocketServer
  private clients: Map<string, CustomWebSocket>

  constructor(port: number) {
    this.wss = new WebSocketServer({ port })
    this.clients = new Map()
    this.initialize()
  }

  private initialize() {
    this.wss.on('connection', (ws: CustomWebSocket) => {
      const clientId = Math.random().toString(36).substring(7)
      
      // Authenticate WebSocket connection
      if (!AuthService.authenticateWebSocket(ws)) {
        ws.close(4001, 'Authentication required')
        return
      }

      this.clients.set(clientId, ws)

      ws.on('message', (message) => {
        const data = JSON.parse(message.toString())
        if (data.type === 'subscribe') {
          ws.jobId = data.jobId
        }
      })

      ws.on('close', () => {
        this.clients.delete(clientId)
      })
    })
  }

  public broadcast(message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.jobId === message.jobId) {
        client.send(JSON.stringify(message))
      }
    })
  }
}

export const wsServer = new VideoProcessingWSServer(3002)