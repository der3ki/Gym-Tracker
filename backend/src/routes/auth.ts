import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../prisma.js'

export const authRouter = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const TOKEN_EXPIRY = '7d'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '888434800135-mkvjmr064n8dsr561nocpp4bpa4tar2u.apps.googleusercontent.com'
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son obligatorios' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'El email ya está registrado' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash },
  })

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email },
  })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son obligatorios' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })

  res.json({
    token,
    user: { id: user.id, email: user.email },
  })
})

authRouter.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' })
    return
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' })
      return
    }
    res.json({ id: user.id, email: user.email })
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
})

authRouter.post('/google', async (req, res) => {
  const { credential } = req.body

  if (!credential) {
    res.status(400).json({ error: 'Token de Google requerido' })
    return
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      res.status(401).json({ error: 'Token de Google inválido' })
      return
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: payload.email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          passwordHash: '', // No password for Google users
        },
      })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })

    res.json({
      token,
      user: { id: user.id, email: user.email },
    })
  } catch {
    res.status(401).json({ error: 'Token de Google inválido' })
  }
})

export { JWT_SECRET }
