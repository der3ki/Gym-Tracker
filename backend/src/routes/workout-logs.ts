import { Router } from 'express'
import { prisma } from '../prisma.js'

export const workoutLogsRouter = Router()

const isPostgres = process.env.DATABASE_URL?.startsWith('postgresql')

function toJson(data: unknown): unknown {
  return isPostgres ? data : JSON.stringify(data)
}

function fromJson(data: unknown): unknown {
  return typeof data === 'string' ? JSON.parse(data) : data
}

workoutLogsRouter.get('/', async (req, res) => {
  const { routineId } = req.query
  const logs = await prisma.workoutLog.findMany({
    where: {
      userId: req.userId,
      ...(routineId && { routineId: routineId as string }),
    },
    orderBy: { date: 'desc' },
  })
  res.json(logs.map(toResponse))
})

workoutLogsRouter.post('/', async (req, res) => {
  const { id, routineId, dayId, date, exercises } = req.body
  const log = await prisma.workoutLog.create({
    data: {
      id,
      userId: req.userId,
      routineId,
      dayId,
      date,
      exercises: toJson(exercises ?? []) as string,
    },
  })
  res.status(201).json(toResponse(log))
})

workoutLogsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.workoutLog.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Workout log not found' })
    return
  }
  await prisma.workoutLog.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

function toResponse(log: { id: string; routineId: string; dayId: string; date: string; exercises: unknown }) {
  return {
    id: log.id,
    routineId: log.routineId,
    dayId: log.dayId,
    date: log.date,
    exercises: fromJson(log.exercises),
  }
}
