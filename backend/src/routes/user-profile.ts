import { Router } from 'express'
import { prisma } from '../prisma.js'

export const userProfileRouter = Router()

userProfileRouter.get('/', async (req, res) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  })
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }
  res.json(toResponse(profile))
})

userProfileRouter.post('/', async (req, res) => {
  const { name, bodyWeight, height, trainingStartDate } = req.body
  const profile = await prisma.userProfile.upsert({
    where: { userId: req.userId },
    update: {
      ...(name !== undefined && { name }),
      ...(bodyWeight !== undefined && { bodyWeight }),
      ...(height !== undefined && { height }),
      ...(trainingStartDate !== undefined && { trainingStartDate }),
    },
    create: {
      userId: req.userId,
      name,
      bodyWeight: bodyWeight ?? null,
      height: height ?? null,
      trainingStartDate: trainingStartDate ?? null,
    },
  })
  res.status(200).json(toResponse(profile))
})

function toResponse(profile: { id: string; name: string; bodyWeight: number | null; height: number | null; trainingStartDate: string | null; createdAt: Date; updatedAt: Date }) {
  return {
    id: profile.id,
    name: profile.name,
    bodyWeight: profile.bodyWeight,
    height: profile.height,
    trainingStartDate: profile.trainingStartDate,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }
}
