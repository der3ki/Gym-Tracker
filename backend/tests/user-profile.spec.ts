import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

const api = request(app)
const HEADERS = { 'x-user-id': 'user-1' }

describe('GET /api/user-profile', () => {
  it('should return 404 when no profile exists', async () => {
    // Arrange & Act
    const res = await api.get('/api/user-profile').set(HEADERS)

    // Assert
    expect(res.status).toBe(404)
  })

  it('should return profile after creation', async () => {
    // Arrange
    await api.post('/api/user-profile').set(HEADERS).send({ name: 'Carlos' })

    // Act
    const res = await api.get('/api/user-profile').set(HEADERS)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Carlos')
    expect(res.body.bodyWeight).toBeNull()
  })
})

describe('POST /api/user-profile', () => {
  it('should create a profile', async () => {
    // Arrange & Act
    const res = await api.post('/api/user-profile').set(HEADERS).send({ name: 'Carlos', bodyWeight: 85, height: 178 })

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Carlos')
    expect(res.body.bodyWeight).toBe(85)
    expect(res.body.height).toBe(178)
  })

  it('should update existing profile (upsert)', async () => {
    // Arrange
    await api.post('/api/user-profile').set(HEADERS).send({ name: 'Carlos' })

    // Act
    const res = await api.post('/api/user-profile').set(HEADERS).send({ name: 'Carlos Updated', bodyWeight: 90 })

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Carlos Updated')
    expect(res.body.bodyWeight).toBe(90)
  })

  it('should isolate profiles between users', async () => {
    // Arrange
    await api.post('/api/user-profile').set(HEADERS).send({ name: 'Carlos' })
    await api.post('/api/user-profile').set({ 'x-user-id': 'user-2' }).send({ name: 'Other' })

    // Act
    const res = await api.get('/api/user-profile').set(HEADERS)

    // Assert
    expect(res.body.name).toBe('Carlos')
  })
})
