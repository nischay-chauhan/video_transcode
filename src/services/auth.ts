import jwt from 'jsonwebtoken'
import { UserPayload } from '../types/auth'
import { WebSocket, WebSocketServer } from 'ws';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private static readonly JWT_EXPIRES_IN = '24h'

  static generateToken(user: Omit<UserPayload, 'iat' | 'exp'>): string {
    return jwt.sign(user, AuthService.JWT_SECRET, {
      expiresIn: AuthService.JWT_EXPIRES_IN
    })
  }

  static verifyToken(token: string): UserPayload | null {
    try {
      const decoded = jwt.verify(token, AuthService.JWT_SECRET) as UserPayload
      return decoded
    } catch (error) {
      return null
    }
  }

  static authenticateRequest(req: Request): boolean {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }

    const token = authHeader.split(' ')[1]
    const decoded = AuthService.verifyToken(token)
    if (decoded) {
      (req as any).user = decoded
      return true
    }
    return false
  }

  static authenticateWebSocket(ws: WebSocket & { upgradeReq: { headers: { get: (key: string) => string | null } } }): boolean {
    const token = ws.upgradeReq.headers.get('authorization')
    if (!token || !token.startsWith('Bearer ')) {
      return false
    }

    const decoded = AuthService.verifyToken(token.split(' ')[1])
    if (decoded) {
      (ws as any).user = decoded
      return true
    }
    return false
  }
}
