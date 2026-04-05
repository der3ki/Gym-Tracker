import { beforeEach } from 'vitest'
import { prisma } from '../src/prisma.js'

beforeEach(async () => {
  await prisma.workoutLog.deleteMany()
  await prisma.trainingWeek.deleteMany()
  await prisma.routine.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.user.deleteMany()

  await prisma.user.create({
    data: { id: 'user-1', email: 'test@test.com', passwordHash: 'hash' },
  })
  await prisma.user.create({
    data: { id: 'user-2', email: 'other@test.com', passwordHash: 'hash' },
  })
})
