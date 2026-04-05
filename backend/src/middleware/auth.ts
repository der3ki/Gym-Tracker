import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string }
      req.userId = payload.userId
      next()
      return
    } catch {
      res.status(401).json({ error: 'Token inválido' })
      return
    }
  }

  // Fallback: x-user-id header (for tests and dev)
  const userId = req.headers['x-user-id']
  if (userId && typeof userId === 'string') {
    req.userId = userId
    next()
    return
  }

  res.status(401).json({ error: 'Autenticación requerida' })
}
