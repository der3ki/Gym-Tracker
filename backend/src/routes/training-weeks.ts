import { Router } from 'express'
import { prisma } from '../prisma.js'

export const trainingWeeksRouter = Router()

const isPostgres = process.env.DATABASE_URL?.startsWith('postgresql')

function toJson(data: unknown): unknown {
  return isPostgres ? data : JSON.stringify(data)
}

function fromJson(data: unknown): unknown {
  return typeof data === 'string' ? JSON.parse(data) : data
}

trainingWeeksRouter.get('/', async (req, res) => {
  const { routineId } = req.query
  const weeks = await prisma.trainingWeek.findMany({
    where: {
      userId: req.userId,
      ...(routineId && { routineId: routineId as string }),
    },
    orderBy: { weekNumber: 'asc' },
  })
  res.json(weeks.map(toResponse))
})

trainingWeeksRouter.get('/:id', async (req, res) => {
  const week = await prisma.trainingWeek.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!week) {
    res.status(404).json({ error: 'Training week not found' })
    return
  }
  res.json(toResponse(week))
})

trainingWeeksRouter.post('/', async (req, res) => {
  const { id, routineId, weekNumber, status, days, createdAt } = req.body
  const week = await prisma.trainingWeek.create({
    data: {
      id,
      userId: req.userId,
      routineId,
      weekNumber,
      status: status ?? 'in_progress',
      days: toJson(days ?? []) as string,
      ...(createdAt && { createdAt: new Date(createdAt) }),
    },
  })
  res.status(201).json(toResponse(week))
})

trainingWeeksRouter.put('/:id', async (req, res) => {
  const existing = await prisma.trainingWeek.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Training week not found' })
    return
  }
  const { status, days } = req.body
  const week = await prisma.trainingWeek.update({
    where: { id: req.params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(days !== undefined && { days: toJson(days) as string }),
    },
  })
  res.json(toResponse(week))
})

trainingWeeksRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.trainingWeek.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Training week not found' })
    return
  }
  await prisma.trainingWeek.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

function toResponse(week: { id: string; routineId: string; weekNumber: number; status: string; days: unknown; createdAt: Date }) {
  return {
    id: week.id,
    routineId: week.routineId,
    weekNumber: week.weekNumber,
    status: week.status,
    days: fromJson(week.days),
    createdAt: week.createdAt.toISOString(),
  }
}
