import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

const api = request(app)

describe('POST /api/auth/register', () => {
  it('should register a new user and return token', async () => {
    // Arrange & Act
    const res = await api.post('/api/auth/register').send({
      email: 'nuevo@gym.com',
      password: 'password123',
    })

    // Assert
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('nuevo@gym.com')
    expect(res.body.user.id).toBeDefined()
  })

  it('should reject duplicate email', async () => {
    // Arrange
    await api.post('/api/auth/register').send({
      email: 'dup@gym.com',
      password: 'password123',
    })

    // Act
    const res = await api.post('/api/auth/register').send({
      email: 'dup@gym.com',
      password: 'password456',
    })

    // Assert
    expect(res.status).toBe(409)
  })

  it('should reject missing fields', async () => {
    // Act
    const res = await api.post('/api/auth/register').send({ email: 'a@b.com' })

    // Assert
    expect(res.status).toBe(400)
  })

  it('should reject short password', async () => {
    // Act
    const res = await api.post('/api/auth/register').send({
      email: 'short@gym.com',
      password: '123',
    })

    // Assert
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    // Arrange
    await api.post('/api/auth/register').send({
      email: 'login@gym.com',
      password: 'password123',
    })

    // Act
    const res = await api.post('/api/auth/login').send({
      email: 'login@gym.com',
      password: 'password123',
    })

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('login@gym.com')
  })

  it('should reject wrong password', async () => {
    // Arrange
    await api.post('/api/auth/register').send({
      email: 'wrong@gym.com',
      password: 'password123',
    })

    // Act
    const res = await api.post('/api/auth/login').send({
      email: 'wrong@gym.com',
      password: 'wrongpassword',
    })

    // Assert
    expect(res.status).toBe(401)
  })

  it('should reject non-existent email', async () => {
    // Act
    const res = await api.post('/api/auth/login').send({
      email: 'noexiste@gym.com',
      password: 'password123',
    })

    // Assert
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('should return user info with valid token', async () => {
    // Arrange
    const registerRes = await api.post('/api/auth/register').send({
      email: 'me@gym.com',
      password: 'password123',
    })
    const token = registerRes.body.token

    // Act
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('me@gym.com')
  })

  it('should reject invalid token', async () => {
    // Act
    const res = await api.get('/api/auth/me').set('Authorization', 'Bearer invalid-token')

    // Assert
    expect(res.status).toBe(401)
  })

  it('should reject missing token', async () => {
    // Act
    const res = await api.get('/api/auth/me')

    // Assert
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/google', () => {
  it('should reject missing credential', async () => {
    // Act
    const res = await api.post('/api/auth/google').send({})

    // Assert
    expect(res.status).toBe(400)
  })

  it('should reject invalid Google token', async () => {
    // Act
    const res = await api.post('/api/auth/google').send({
      credential: 'invalid-google-token',
    })

    // Assert
    expect(res.status).toBe(401)
  })
})

describe('JWT auth on protected routes', () => {
  it('should access protected routes with JWT token', async () => {
    // Arrange
    const registerRes = await api.post('/api/auth/register').send({
      email: 'protected@gym.com',
      password: 'password123',
    })
    const token = registerRes.body.token

    // Act
    const res = await api
      .get('/api/routines')
      .set('Authorization', `Bearer ${token}`)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('should reject protected routes without auth', async () => {
    // Act
    const res = await api.get('/api/routines')

    // Assert
    expect(res.status).toBe(401)
  })
})
