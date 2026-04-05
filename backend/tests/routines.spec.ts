import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

const api = request(app)
const HEADERS = { 'x-user-id': 'user-1' }

describe('GET /api/routines', () => {
  it('should return empty array when no routines', async () => {
    // Arrange & Act
    const res = await api.get('/api/routines').set(HEADERS)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('should only return routines for the authenticated user', async () => {
    // Arrange
    await api.post('/api/routines').set(HEADERS).send({ id: 'r1', name: 'My Routine' })
    await api.post('/api/routines').set({ 'x-user-id': 'user-2' }).send({ id: 'r2', name: 'Other Routine' })

    // Act
    const res = await api.get('/api/routines').set(HEADERS)

    // Assert
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('My Routine')
  })
})

describe('POST /api/routines', () => {
  it('should create a routine', async () => {
    // Arrange
    const routine = { id: 'r1', name: 'Powerbuilding', days: [{ id: 'd1', name: 'Upper', exercises: [] }] }

    // Act
    const res = await api.post('/api/routines').set(HEADERS).send(routine)

    // Assert
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('r1')
    expect(res.body.name).toBe('Powerbuilding')
    expect(res.body.days).toEqual([{ id: 'd1', name: 'Upper', exercises: [] }])
  })
})

describe('GET /api/routines/:id', () => {
  it('should return a specific routine', async () => {
    // Arrange
    await api.post('/api/routines').set(HEADERS).send({ id: 'r1', name: 'Test' })

    // Act
    const res = await api.get('/api/routines/r1').set(HEADERS)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Test')
  })

  it('should return 404 for another users routine', async () => {
    // Arrange
    await api.post('/api/routines').set({ 'x-user-id': 'user-2' }).send({ id: 'r1', name: 'Other' })

    // Act
    const res = await api.get('/api/routines/r1').set(HEADERS)

    // Assert
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/routines/:id', () => {
  it('should update routine name and days', async () => {
    // Arrange
    await api.post('/api/routines').set(HEADERS).send({ id: 'r1', name: 'Old Name', days: [] })

    // Act
    const res = await api.put('/api/routines/r1').set(HEADERS).send({ name: 'New Name', days: [{ id: 'd1', name: 'Leg Day', exercises: [] }] })

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('New Name')
    expect(res.body.days).toHaveLength(1)
  })
})

describe('DELETE /api/routines/:id', () => {
  it('should delete a routine', async () => {
    // Arrange
    await api.post('/api/routines').set(HEADERS).send({ id: 'r1', name: 'To Delete' })

    // Act
    const res = await api.delete('/api/routines/r1').set(HEADERS)

    // Assert
    expect(res.status).toBe(204)
    const list = await api.get('/api/routines').set(HEADERS)
    expect(list.body).toHaveLength(0)
  })

  it('should return 404 for non-existent routine', async () => {
    // Arrange & Act
    const res = await api.delete('/api/routines/non-existent').set(HEADERS)

    // Assert
    expect(res.status).toBe(404)
  })
})

describe('Auth middleware', () => {
  it('should return 401 without x-user-id header', async () => {
    // Arrange & Act
    const res = await api.get('/api/routines')

    // Assert
    expect(res.status).toBe(401)
  })
})
