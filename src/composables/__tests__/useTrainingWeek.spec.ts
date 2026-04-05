import { describe, it, expect, beforeEach } from 'vitest'
import { useTrainingWeek } from '../useTrainingWeek'
import { LocalStorageAdapter } from '@/services/storage'
import type { TrainingWeek, Routine } from '@/types'
import type { IdGenerator } from '@/services/id-generator'

let idCounter: number

const sequentialIdGenerator: IdGenerator = {
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

describe('useTrainingWeek', () => {
  let storage: LocalStorageAdapter<TrainingWeek>

  beforeEach(() => {
    idCounter = 0
    storage = new LocalStorageAdapter<TrainingWeek>('test-weeks')
  })

  describe('startFirstWeek', () => {
    it('should create week 1 with pending days and first-week targets', async () => {
      // Arrange
      const { startFirstWeek } = useTrainingWeek(storage, sequentialIdGenerator)

      // Act
      const week = await startFirstWeek(mockRoutine)

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
      const { startFirstWeek, saveDayWorkout, getWeekById } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      const week = await startFirstWeek(mockRoutine)

      // Act
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 80, rir: 2 }] },
        { exerciseId: 'curl', sets: [{ reps: 10, weight: 12, rir: 3 }] },
      ])

      // Assert
      const updated = getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.status).toBe('completed')
      expect(day1.completedExercises).toHaveLength(2)
      expect(day1.completedExercises[0].sets[0].weight).toBe(80)
    })

    it('should not affect other days', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, getWeekById } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      const week = await startFirstWeek(mockRoutine)

      // Act
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Assert
      const updated = getWeekById(week.id)!
      const day2 = updated.days.find((d) => d.dayId === 'd2')!
      expect(day2.status).toBe('pending')
      expect(day2.completedExercises).toHaveLength(0)
    })
  })

  describe('isWeekComplete', () => {
    it('should return false when not all days are completed', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, isWeekComplete } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      const week = await startFirstWeek(mockRoutine)
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Act
      const complete = await isWeekComplete(week.id)

      // Assert
      expect(complete).toBe(false)
    })

    it('should return true when all days are completed', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, isWeekComplete } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      const week = await startFirstWeek(mockRoutine)
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])
      await saveDayWorkout(week.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const complete = await isWeekComplete(week.id)

      // Assert
      expect(complete).toBe(true)
    })
  })

  describe('completeWeekAndGenerateNext', () => {
    it('should mark current week as completed and create next week', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, completeWeekAndGenerateNext, getWeekById } =
        useTrainingWeek(storage, sequentialIdGenerator)
      const week1 = await startFirstWeek(mockRoutine)
      await saveDayWorkout(week1.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 4, weight: 80, rir: 2 }] },
        { exerciseId: 'curl', sets: [{ reps: 10, weight: 12, rir: 3 }] },
      ])
      await saveDayWorkout(week1.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const week2 = (await completeWeekAndGenerateNext(week1.id, mockRoutine))!

      // Assert
      expect(getWeekById(week1.id)!.status).toBe('completed')
      expect(week2.weekNumber).toBe(2)
      expect(week2.status).toBe('in_progress')
      expect(week2.days).toHaveLength(2)
    })

    it('should generate targets based on previous week performance', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, completeWeekAndGenerateNext } =
        useTrainingWeek(storage, sequentialIdGenerator)
      const week1 = await startFirstWeek(mockRoutine)
      await saveDayWorkout(week1.id, 'd1', [
        { exerciseId: 'bench', sets: [
          { reps: 4, weight: 80, rir: 2 },
          { reps: 4, weight: 80, rir: 2 },
        ]},
      ])
      await saveDayWorkout(week1.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const week2 = (await completeWeekAndGenerateNext(week1.id, mockRoutine))!

      // Assert - bench did 4 reps, should suggest 5 next week
      const day1Targets = week2.days.find((d) => d.dayId === 'd1')!.exerciseTargets
      const benchTarget = day1Targets.find((t) => t.exerciseId === 'bench')!
      expect(benchTarget.targetWeight).toBe(80)
      expect(benchTarget.targetReps).toBe(5)
    })

    it('should suggest weight increase after 2 weeks at top reps with good RIR', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, completeWeekAndGenerateNext } =
        useTrainingWeek(storage, sequentialIdGenerator)

      // Week 1: squat 6 reps x 100kg RIR 2
      const week1 = await startFirstWeek(mockRoutine)
      await saveDayWorkout(week1.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 80, rir: 2 }] },
      ])
      await saveDayWorkout(week1.id, 'd2', [
        { exerciseId: 'squat', sets: [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 3 },
        ]},
      ])
      const week2 = (await completeWeekAndGenerateNext(week1.id, mockRoutine))!

      // Week 2: same performance
      await saveDayWorkout(week2.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 80, rir: 2 }] },
      ])
      await saveDayWorkout(week2.id, 'd2', [
        { exerciseId: 'squat', sets: [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
        ]},
      ])

      // Act
      const week3 = (await completeWeekAndGenerateNext(week2.id, mockRoutine))!

      // Assert - squat should increase to 102.5kg, reps back to min (1)
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
      const { startFirstWeek, saveDayWorkout, completeWeekAndGenerateNext, getWeeksByRoutine } =
        useTrainingWeek(storage, sequentialIdGenerator)
      const week1 = await startFirstWeek(mockRoutine)
      await saveDayWorkout(week1.id, 'd1', [])
      await saveDayWorkout(week1.id, 'd2', [])
      await completeWeekAndGenerateNext(week1.id, mockRoutine)

      // Act
      const allWeeks = getWeeksByRoutine('r1')

      // Assert
      expect(allWeeks).toHaveLength(2)
      expect(allWeeks[0].weekNumber).toBe(1)
      expect(allWeeks[1].weekNumber).toBe(2)
    })
  })

  describe('getActiveWeek', () => {
    it('should return the in_progress week', async () => {
      // Arrange
      const { startFirstWeek, getActiveWeek } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      await startFirstWeek(mockRoutine)

      // Act
      const active = getActiveWeek('r1')

      // Assert
      expect(active).toBeDefined()
      expect(active!.weekNumber).toBe(1)
      expect(active!.status).toBe('in_progress')
    })

    it('should return undefined when no active week', () => {
      // Arrange
      const { getActiveWeek } = useTrainingWeek(storage, sequentialIdGenerator)

      // Act
      const active = getActiveWeek('r1')

      // Assert
      expect(active).toBeUndefined()
    })
  })

  describe('syncWeekWithRoutine', () => {
    it('should add new days from routine to existing week', async () => {
      // Arrange
      const { startFirstWeek, syncWeekWithRoutine, getWeekById } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      const oneDay: Routine = { ...mockRoutine, days: [mockRoutine.days[0]] }
      const week = await startFirstWeek(oneDay)
      expect(week.days).toHaveLength(1)

      // Act - routine now has 2 days
      await syncWeekWithRoutine(week.id, mockRoutine)

      // Assert
      const updated = getWeekById(week.id)!
      expect(updated.days).toHaveLength(2)
      expect(updated.days[1].dayId).toBe('d2')
      expect(updated.days[1].status).toBe('pending')
    })

    it('should add new exercises to pending days', async () => {
      // Arrange
      const { startFirstWeek, syncWeekWithRoutine, getWeekById } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      const routineWithOneExercise: Routine = {
        ...mockRoutine,
        days: [{
          ...mockRoutine.days[0],
          exercises: [mockRoutine.days[0].exercises[0]],
        }, mockRoutine.days[1]],
      }
      const week = await startFirstWeek(routineWithOneExercise)

      // Act - routine now has 2 exercises on day 1
      await syncWeekWithRoutine(week.id, mockRoutine)

      // Assert
      const updated = getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.exerciseTargets).toHaveLength(2)
    })

    it('should not modify completed days', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, syncWeekWithRoutine, getWeekById } = useTrainingWeek(
        storage,
        sequentialIdGenerator,
      )
      const routineWithOneExercise: Routine = {
        ...mockRoutine,
        days: [{
          ...mockRoutine.days[0],
          exercises: [mockRoutine.days[0].exercises[0]],
        }, mockRoutine.days[1]],
      }
      const week = await startFirstWeek(routineWithOneExercise)
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Act - routine now has 2 exercises on day 1, but day 1 is already completed
      await syncWeekWithRoutine(week.id, mockRoutine)

      // Assert - day 1 should not be modified
      const updated = getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.exerciseTargets).toHaveLength(1)
      expect(day1.status).toBe('completed')
    })

    it('should not sync a completed week', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, completeWeekAndGenerateNext, syncWeekWithRoutine, getWeekById } =
        useTrainingWeek(storage, sequentialIdGenerator)
      const oneDay: Routine = { ...mockRoutine, days: [mockRoutine.days[0]] }
      const week = await startFirstWeek(oneDay)
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])
      await completeWeekAndGenerateNext(week.id, oneDay)

      // Act - try to sync completed week with routine that now has 2 days
      await syncWeekWithRoutine(week.id, mockRoutine)

      // Assert - completed week should not change
      const updated = getWeekById(week.id)!
      expect(updated.days).toHaveLength(1)
      expect(updated.status).toBe('completed')
    })
  })

  describe('saveDayWorkout on completed week', () => {
    it('should not allow saving to a completed week', async () => {
      // Arrange
      const { startFirstWeek, saveDayWorkout, completeWeekAndGenerateNext, getWeekById } =
        useTrainingWeek(storage, sequentialIdGenerator)
      const week = await startFirstWeek(mockRoutine)
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])
      await saveDayWorkout(week.id, 'd2', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])
      await completeWeekAndGenerateNext(week.id, mockRoutine)

      // Act - try to save to completed week
      await saveDayWorkout(week.id, 'd1', [
        { exerciseId: 'bench', sets: [{ reps: 6, weight: 90, rir: 1 }] },
      ])

      // Assert - original data should be unchanged
      const updated = getWeekById(week.id)!
      const day1 = updated.days.find((d) => d.dayId === 'd1')!
      expect(day1.completedExercises[0].sets[0].weight).toBe(80)
    })
  })
})
