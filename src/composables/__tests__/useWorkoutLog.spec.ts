import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkoutLog } from '../useWorkoutLog'
import { LocalStorageAdapter } from '@/services/storage'
import type { WorkoutLog } from '@/types'
import type { IdGenerator } from '@/services/id-generator'

let idCounter: number

const sequentialIdGenerator: IdGenerator = {
  generate: () => `log-${++idCounter}`,
}

describe('useWorkoutLog', () => {
  let storage: LocalStorageAdapter<WorkoutLog>

  beforeEach(() => {
    idCounter = 0
    storage = new LocalStorageAdapter<WorkoutLog>('test-logs')
  })

  describe('createLog', () => {
    it('should create and persist a workout log', async () => {
      // Arrange
      const { createLog, logs } = useWorkoutLog(storage, sequentialIdGenerator)
      const exercises = [
        {
          exerciseId: 'ex-1',
          sets: [{ reps: 5, weight: 100, rir: 2 }],
        },
      ]

      // Act
      const log = await createLog('routine-1', 'day-1', '2026-04-01', exercises)

      // Assert
      expect(log.routineId).toBe('routine-1')
      expect(log.dayId).toBe('day-1')
      expect(log.exercises).toHaveLength(1)
      expect(logs.value).toHaveLength(1)
    })
  })

  describe('deleteLog', () => {
    it('should remove a log by id', async () => {
      // Arrange
      const { createLog, deleteLog, logs } = useWorkoutLog(storage, sequentialIdGenerator)
      const log = await createLog('r1', 'd1', '2026-04-01', [])

      // Act
      await deleteLog(log.id)

      // Assert
      expect(logs.value).toHaveLength(0)
    })
  })

  describe('getLogsByDay', () => {
    it('should return logs filtered by day sorted by date descending', async () => {
      // Arrange
      const { createLog, getLogsByDay } = useWorkoutLog(storage, sequentialIdGenerator)
      await createLog('r1', 'day-1', '2026-03-25', [])
      await createLog('r1', 'day-1', '2026-04-01', [])
      await createLog('r1', 'day-2', '2026-04-01', [])

      // Act
      const result = getLogsByDay('day-1')

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2026-04-01')
      expect(result[1].date).toBe('2026-03-25')
    })
  })

  describe('getLogsByExercise', () => {
    it('should return logs containing a specific exercise', async () => {
      // Arrange
      const { createLog, getLogsByExercise } = useWorkoutLog(storage, sequentialIdGenerator)
      await createLog('r1', 'd1', '2026-04-01', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])
      await createLog('r1', 'd1', '2026-03-25', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 97.5, rir: 3 }] },
      ])
      await createLog('r1', 'd2', '2026-04-01', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Act
      const result = getLogsByExercise('squat')

      // Assert
      expect(result).toHaveLength(2)
    })
  })

  describe('getLastNLogsByExercise', () => {
    it('should return only the last N logs for an exercise', async () => {
      // Arrange
      const { createLog, getLastNLogsByExercise } = useWorkoutLog(storage, sequentialIdGenerator)
      await createLog('r1', 'd1', '2026-03-18', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 95, rir: 3 }] },
      ])
      await createLog('r1', 'd1', '2026-03-25', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 97.5, rir: 2 }] },
      ])
      await createLog('r1', 'd1', '2026-04-01', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const result = getLastNLogsByExercise('squat', 2)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2026-04-01')
      expect(result[1].date).toBe('2026-03-25')
    })
  })
})
