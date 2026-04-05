import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

const api = request(app)
const HEADERS = { 'x-user-id': 'user-1' }

async function createRoutine(id = 'r1') {
  await api.post('/api/routines').set(HEADERS).send({ id, name: 'Test Routine', days: [] })
}

describe('GET /api/training-weeks', () => {
  it('should return empty array when no weeks', async () => {
    // Arrange & Act
    const res = await api.get('/api/training-weeks').set(HEADERS)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('should filter by routineId', async () => {
    // Arrange
    await createRoutine('r1')
    await createRoutine('r2')
    await api.post('/api/training-weeks').set(HEADERS).send({ id: 'w1', routineId: 'r1', weekNumber: 1, days: [] })
    await api.post('/api/training-weeks').set(HEADERS).send({ id: 'w2', routineId: 'r2', weekNumber: 1, days: [] })

    // Act
    const res = await api.get('/api/training-weeks?routineId=r1').set(HEADERS)

    // Assert
    expect(res.body).toHaveLength(1)
    expect(res.body[0].routineId).toBe('r1')
  })
})

describe('POST /api/training-weeks', () => {
  it('should create a training week', async () => {
    // Arrange
    await createRoutine()
    const days = [{ dayId: 'd1', status: 'pending', exerciseTargets: [], completedExercises: [] }]

    // Act
    const res = await api.post('/api/training-weeks').set(HEADERS).send({ id: 'w1', routineId: 'r1', weekNumber: 1, days })

    // Assert
    expect(res.status).toBe(201)
    expect(res.body.weekNumber).toBe(1)
    expect(res.body.status).toBe('in_progress')
    expect(res.body.days).toEqual(days)
  })
})

describe('PUT /api/training-weeks/:id', () => {
  it('should update week status and days', async () => {
    // Arrange
    await createRoutine()
    await api.post('/api/training-weeks').set(HEADERS).send({ id: 'w1', routineId: 'r1', weekNumber: 1, days: [] })

    // Act
    const res = await api.put('/api/training-weeks/w1').set(HEADERS).send({ status: 'completed', days: [{ dayId: 'd1', status: 'completed' }] })

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('completed')
    expect(res.body.days).toHaveLength(1)
  })
})

describe('DELETE /api/training-weeks/:id', () => {
  it('should delete a training week', async () => {
    // Arrange
    await createRoutine()
    await api.post('/api/training-weeks').set(HEADERS).send({ id: 'w1', routineId: 'r1', weekNumber: 1, days: [] })

    // Act
    const res = await api.delete('/api/training-weeks/w1').set(HEADERS)

    // Assert
    expect(res.status).toBe(204)
  })

  it('should not delete another users week', async () => {
    // Arrange
    await createRoutine()
    await api.post('/api/training-weeks').set(HEADERS).send({ id: 'w1', routineId: 'r1', weekNumber: 1, days: [] })

    // Act
    const res = await api.delete('/api/training-weeks/w1').set({ 'x-user-id': 'user-2' })

    // Assert
    expect(res.status).toBe(404)
  })
})
