import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTrainingWeekStore } from '../trainingWeek'
import { LocalStorageAdapter } from '@/services/storage'
import { setStorageOverride, resetStorageRegistry } from '@/services/storage-registry'
import { setIdGeneratorOverride, resetIdGeneratorOverride } from '@/services/id-generator-registry'
import type { TrainingWeek, Routine } from '@/types'

let idCounter: number

const sequentialIdGenerator = {
  generate: () => `id-${++idCounter}`,
}

const mockRoutine: Routine = {
  id: 'r1',
  name: 'Powerbuilding',
  days: [
    {
      id: 'd1',
      name: 'Día 1 - Upper',
      exercises: [
        { id: 'bench', name: 'Press Banca', type: 'strength', repRange: { min: 1, max: 6 }, defaultSets: 4 },
        { id: 'curl', name: 'Curl', type: 'hypertrophy', repRange: { min: 6, max: 12 }, defaultSets: 3 },
      ],
    },
    {
      id: 'd2',
      name: 'Día 2 - Lower',
      exercises: [
        { id: 'squat', name: 'Sentadilla', type: 'strength', repRange: { min: 1, max: 6 }, defaultSets: 4 },
      ],
    },
  ],
  createdAt: '2026-04-01',
  updatedAt: '2026-04-01',
}

describe('trainingWeekStore', () => {
  beforeEach(() => {
    idCounter = 0
    setActivePinia(createPinia())
    const storage = new LocalStorageAdapter<TrainingWeek>('test-weeks')
    setStorageOverride('training-weeks', storage)
    setIdGeneratorOverride(sequentialIdGenerator)
  })

  beforeEach(() => {
    return () => {
      resetStorageRegistry()
      resetIdGeneratorOverride()
    }
  })

  describe('startFirstWeek', () => {
    it('should create week 1 with pending days and first-week targets', async () => {
      // Arrange
      const store = useTrainingWeekStore()

      // Act
      const week = await store.startFirstWeek(mockRoutine)

      // Assert
      expect(week.weekNumber).toBe(1)
      expect(week.status).toBe('in_progress')
      expect(week.routineId).toBe('r1')
      expect(week.days).toHaveLength(2)
      expect(week.days[0].status).toBe('pending')
      expect(week.days[0].exerciseTargets).toHaveLength(2)
      expect(week.days[0].exerciseTargets[0].targetWeight).toBe(0)
      expect(week.days[0].exerciseTargets[0].recommendation).toContain('Primera semana')
    })
  })

  describe('saveDayWorkout', () => {
    it('should save completed exercises and mark day as completed', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week = await store.startFirstWeek(mockRoutine)

      // Act
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 80, rir: 2 }] },
        { exerciseId: 'curl', sets: [{ reps: 10, weight: 12, rir: 3 }] },
      ])

      // Assert
      const updated = store.getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.status).toBe('completed')
      expect(day1.completedExercises).toHaveLength(2)
      expect(day1.completedExercises[0].sets[0].weight).toBe(80)
    })

    it('should not affect other days', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week = await store.startFirstWeek(mockRoutine)

      // Act
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Assert
      const updated = store.getWeekById(week.id)!
      const day2 = updated.days.find((d) => d.dayId === 'd2')!
      expect(day2.status).toBe('pending')
      expect(day2.completedExercises).toHaveLength(0)
    })
  })

  describe('isWeekComplete', () => {
    it('should return false when not all days are completed', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week = await store.startFirstWeek(mockRoutine)
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Act
      const complete = store.isWeekComplete(week.id)

      // Assert
      expect(complete).toBe(false)
    })

    it('should return true when all days are completed', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week = await store.startFirstWeek(mockRoutine)
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])
      await store.saveDayWorkout(week.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const complete = store.isWeekComplete(week.id)

      // Assert
      expect(complete).toBe(true)
    })
  })

  describe('completeWeekAndGenerateNext', () => {
    it('should mark current week as completed and create next week', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week1 = await store.startFirstWeek(mockRoutine)
      await store.saveDayWorkout(week1.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 4, weight: 80, rir: 2 }] },
        { exerciseId: 'curl', sets: [{ reps: 10, weight: 12, rir: 3 }] },
      ])
      await store.saveDayWorkout(week1.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const week2 = (await store.completeWeekAndGenerateNext(week1.id, mockRoutine))!

      // Assert
      expect(store.getWeekById(week1.id)!.status).toBe('completed')
      expect(week2.weekNumber).toBe(2)
      expect(week2.status).toBe('in_progress')
      expect(week2.days).toHaveLength(2)
    })

    it('should generate targets based on previous week performance', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week1 = await store.startFirstWeek(mockRoutine)
      await store.saveDayWorkout(week1.id, 'd1', [
        { exerciseId: 'bench', sets: [
          { reps: 4, weight: 80, rir: 2 },
          { reps: 4, weight: 80, rir: 2 },
        ]},
      ])
      await store.saveDayWorkout(week1.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const week2 = (await store.completeWeekAndGenerateNext(week1.id, mockRoutine))!

      // Assert
      const day1Targets = week2.days.find((d) => d.dayId === 'd1')!.exerciseTargets
      const benchTarget = day1Targets.find((t) => t.exerciseId === 'bench')!
      expect(benchTarget.targetWeight).toBe(80)
      expect(benchTarget.targetReps).toBe(5)
    })

    it('should suggest weight increase after 2 weeks at top reps with good RIR', async () => {
      // Arrange
      const store = useTrainingWeekStore()

      const week1 = await store.startFirstWeek(mockRoutine)
      await store.saveDayWorkout(week1.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 80, rir: 2 }] },
      ])
      await store.saveDayWorkout(week1.id, 'd2', [
        { exerciseId: 'squat', sets: [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 3 },
        ]},
      ])
      const week2 = (await store.completeWeekAndGenerateNext(week1.id, mockRoutine))!

      await store.saveDayWorkout(week2.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 80, rir: 2 }] },
      ])
      await store.saveDayWorkout(week2.id, 'd2', [
        { exerciseId: 'squat', sets: [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
        ]},
      ])

      // Act
      const week3 = (await store.completeWeekAndGenerateNext(week2.id, mockRoutine))!

      // Assert
      const squatTarget = week3.days.find((d) => d.dayId === 'd2')!
        .exerciseTargets.find((t) => t.exerciseId === 'squat')!
      expect(squatTarget.targetWeight).toBe(102.5)
      expect(squatTarget.targetReps).toBe(1)
      expect(squatTarget.recommendation).toContain('Sube peso')
    })
  })

  describe('getWeeksByRoutine', () => {
    it('should return weeks sorted by week number', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week1 = await store.startFirstWeek(mockRoutine)
      await store.saveDayWorkout(week1.id, 'd1', [])
      await store.saveDayWorkout(week1.id, 'd2', [])
      await store.completeWeekAndGenerateNext(week1.id, mockRoutine)

      // Act
      const allWeeks = store.getWeeksByRoutine('r1')

      // Assert
      expect(allWeeks).toHaveLength(2)
      expect(allWeeks[0].weekNumber).toBe(1)
      expect(allWeeks[1].weekNumber).toBe(2)
    })
  })

  describe('getActiveWeek', () => {
    it('should return the in_progress week', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      await store.startFirstWeek(mockRoutine)

      // Act
      const active = store.getActiveWeek('r1')

      // Assert
      expect(active).toBeDefined()
      expect(active!.weekNumber).toBe(1)
      expect(active!.status).toBe('in_progress')
    })

    it('should return undefined when no active week', () => {
      // Arrange
      const store = useTrainingWeekStore()

      // Act
      const active = store.getActiveWeek('r1')

      // Assert
      expect(active).toBeUndefined()
    })
  })

  describe('syncWeekWithRoutine', () => {
    it('should add new days from routine to existing week', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const oneDay: Routine = { ...mockRoutine, days: [mockRoutine.days[0]] }
      const week = await store.startFirstWeek(oneDay)
      expect(week.days).toHaveLength(1)

      // Act
      await store.syncWeekWithRoutine(week.id, mockRoutine)

      // Assert
      const updated = store.getWeekById(week.id)!
      expect(updated.days).toHaveLength(2)
      expect(updated.days[1].dayId).toBe('d2')
      expect(updated.days[1].status).toBe('pending')
    })

    it('should add new exercises to pending days', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const routineWithOneExercise: Routine = {
        ...mockRoutine,
        days: [{
          ...mockRoutine.days[0],
          exercises: [mockRoutine.days[0].exercises[0]],
        }, mockRoutine.days[1]],
      }
      const week = await store.startFirstWeek(routineWithOneExercise)

      // Act
      await store.syncWeekWithRoutine(week.id, mockRoutine)

      // Assert
      const updated = store.getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.exerciseTargets).toHaveLength(2)
    })

    it('should not modify completed days', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const routineWithOneExercise: Routine = {
        ...mockRoutine,
        days: [{
          ...mockRoutine.days[0],
          exercises: [mockRoutine.days[0].exercises[0]],
        }, mockRoutine.days[1]],
      }
      const week = await store.startFirstWeek(routineWithOneExercise)
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Act
      await store.syncWeekWithRoutine(week.id, mockRoutine)

      // Assert
      const updated = store.getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.exerciseTargets).toHaveLength(1)
      expect(day1.status).toBe('completed')
    })

    it('should not sync a completed week', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const oneDay: Routine = { ...mockRoutine, days: [mockRoutine.days[0]] }
      const week = await store.startFirstWeek(oneDay)
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])
      await store.completeWeekAndGenerateNext(week.id, oneDay)

      // Act
      await store.syncWeekWithRoutine(week.id, mockRoutine)

      // Assert
      const updated = store.getWeekById(week.id)!
      expect(updated.days).toHaveLength(1)
      expect(updated.status).toBe('completed')
    })
  })

  describe('saveDayWorkout on completed week', () => {
    it('should not allow saving to a completed week', async () => {
      // Arrange
      const store = useTrainingWeekStore()
      const week = await store.startFirstWeek(mockRoutine)
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])
      await store.saveDayWorkout(week.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])
      await store.completeWeekAndGenerateNext(week.id, mockRoutine)

      // Act
      await store.saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 90, rir: 1 }] },
      ])

      // Assert
      const updated = store.getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.completedExercises[0].sets[0].weight).toBe(80)
    })
  })
})
