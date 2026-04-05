import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

const api = request(app)
const HEADERS = { 'x-user-id': 'user-1' }

describe('GET /api/workout-logs', () => {
  it('should return empty array when no logs', async () => {
    // Arrange & Act
    const res = await api.get('/api/workout-logs').set(HEADERS)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('should only return logs for the authenticated user', async () => {
    // Arrange
    await api.post('/api/workout-logs').set(HEADERS).send({ id: 'l1', routineId: 'r1', dayId: 'd1', date: '2026-04-01', exercises: [] })
    await api.post('/api/workout-logs').set({ 'x-user-id': 'user-2' }).send({ id: 'l2', routineId: 'r1', dayId: 'd1', date: '2026-04-01', exercises: [] })

    // Act
    const res = await api.get('/api/workout-logs').set(HEADERS)

    // Assert
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('l1')
  })
})

describe('POST /api/workout-logs', () => {
  it('should create a workout log', async () => {
    // Arrange
    const exercises = [{ exerciseId: 'e1', sets: [{ reps: 5, weight: 100, rir: 2 }] }]

    // Act
    const res = await api.post('/api/workout-logs').set(HEADERS).send({ id: 'l1', routineId: 'r1', dayId: 'd1', date: '2026-04-01', exercises })

    // Assert
    expect(res.status).toBe(201)
    expect(res.body.exercises).toEqual(exercises)
  })
})

describe('DELETE /api/workout-logs/:id', () => {
  it('should delete a workout log', async () => {
    // Arrange
    await api.post('/api/workout-logs').set(HEADERS).send({ id: 'l1', routineId: 'r1', dayId: 'd1', date: '2026-04-01', exercises: [] })

    // Act
    const res = await api.delete('/api/workout-logs/l1').set(HEADERS)

    // Assert
    expect(res.status).toBe(204)
  })

  it('should return 404 for non-existent log', async () => {
    // Arrange & Act
    const res = await api.delete('/api/workout-logs/non-existent').set(HEADERS)

    // Assert
    expect(res.status).toBe(404)
  })
})
