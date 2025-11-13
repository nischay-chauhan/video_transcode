export interface UserPayload {
  id: string
  username: string
  role: 'user' | 'admin'
  iat: number
  exp: number
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload
}

export interface AuthenticatedWebSocket extends WebSocket {
  user?: UserPayload
}
