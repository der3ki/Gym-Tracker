import { Router } from 'express'
import { prisma } from '../prisma.js'

export const routinesRouter = Router()

const isPostgres = process.env.DATABASE_URL?.startsWith('postgresql')

function toJson(data: unknown): unknown {
  return isPostgres ? data : JSON.stringify(data)
}

function fromJson(data: unknown): unknown {
  return typeof data === 'string' ? JSON.parse(data) : data
}

routinesRouter.get('/', async (req, res) => {
  const routines = await prisma.routine.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(routines.map(toResponse))
})

routinesRouter.get('/:id', async (req, res) => {
  const routine = await prisma.routine.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!routine) {
    res.status(404).json({ error: 'Routine not found' })
    return
  }
  res.json(toResponse(routine))
})

routinesRouter.post('/', async (req, res) => {
  const { id, name, days, createdAt, updatedAt } = req.body
  const routine = await prisma.routine.create({
    data: {
      id,
      userId: req.userId,
      name,
      days: toJson(days ?? []) as string,
      ...(createdAt && { createdAt: new Date(createdAt) }),
      ...(updatedAt && { updatedAt: new Date(updatedAt) }),
    },
  })
  res.status(201).json(toResponse(routine))
})

routinesRouter.put('/:id', async (req, res) => {
  const existing = await prisma.routine.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Routine not found' })
    return
  }
  const { name, days } = req.body
  const routine = await prisma.routine.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(days !== undefined && { days: toJson(days) as string }),
    },
  })
  res.json(toResponse(routine))
})

routinesRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.routine.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Routine not found' })
    return
  }
  await prisma.routine.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

function toResponse(routine: { id: string; name: string; days: unknown; createdAt: Date; updatedAt: Date }) {
  return {
    id: routine.id,
    name: routine.name,
    days: fromJson(routine.days),
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
  }
}
