import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkoutLogStore } from '../workoutLog'
import { LocalStorageAdapter } from '@/services/storage'
import { setStorageOverride, resetStorageRegistry } from '@/services/storage-registry'
import { setIdGeneratorOverride, resetIdGeneratorOverride } from '@/services/id-generator-registry'
import type { WorkoutLog } from '@/types'

let idCounter: number

const sequentialIdGenerator = {
  generate: () => `log-${++idCounter}`,
}

describe('workoutLogStore', () => {
  beforeEach(() => {
    idCounter = 0
    setActivePinia(createPinia())
    const storage = new LocalStorageAdapter<WorkoutLog>('test-logs')
    setStorageOverride('workout-logs', storage)
    setIdGeneratorOverride(sequentialIdGenerator)
  })

  beforeEach(() => {
    return () => {
      resetStorageRegistry()
      resetIdGeneratorOverride()
    }
  })

  describe('createLog', () => {
    it('should create and persist a workout log', async () => {
      // Arrange
      const store = useWorkoutLogStore()
      const exercises = [
        {
          exerciseId: 'ex-1',
          sets: [{ reps: 5, weight: 100, rir: 2 }],
        },
      ]

      // Act
      const log = await store.createLog('routine-1', 'day-1', '2026-04-01', exercises)

      // Assert
      expect(log.routineId).toBe('routine-1')
      expect(log.dayId).toBe('day-1')
      expect(log.exercises).toHaveLength(1)
      expect(store.logs).toHaveLength(1)
    })
  })

  describe('deleteLog', () => {
    it('should remove a log by id', async () => {
      // Arrange
      const store = useWorkoutLogStore()
      const log = await store.createLog('r1', 'd1', '2026-04-01', [])

      // Act
      await store.deleteLog(log.id)

      // Assert
      expect(store.logs).toHaveLength(0)
    })
  })

  describe('getLogsByDay', () => {
    it('should return logs filtered by day sorted by date descending', async () => {
      // Arrange
      const store = useWorkoutLogStore()
      await store.createLog('r1', 'day-1', '2026-03-25', [])
      await store.createLog('r1', 'day-1', '2026-04-01', [])
      await store.createLog('r1', 'day-2', '2026-04-01', [])

      // Act
      const result = store.getLogsByDay('day-1')

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2026-04-01')
      expect(result[1].date).toBe('2026-03-25')
    })
  })

  describe('getLogsByExercise', () => {
    it('should return logs containing a specific exercise', async () => {
      // Arrange
      const store = useWorkoutLogStore()
      await store.createLog('r1', 'd1', '2026-04-01', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])
      await store.createLog('r1', 'd1', '2026-03-25', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 97.5, rir: 3 }] },
      ])
      await store.createLog('r1', 'd2', '2026-04-01', [
        { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
      ])

      // Act
      const result = store.getLogsByExercise('squat')

      // Assert
      expect(result).toHaveLength(2)
    })
  })

  describe('getLastNLogsByExercise', () => {
    it('should return only the last N logs for an exercise', async () => {
      // Arrange
      const store = useWorkoutLogStore()
      await store.createLog('r1', 'd1', '2026-03-18', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 95, rir: 3 }] },
      ])
      await store.createLog('r1', 'd1', '2026-03-25', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 97.5, rir: 2 }] },
      ])
      await store.createLog('r1', 'd1', '2026-04-01', [
        { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
      ])

      // Act
      const result = store.getLastNLogsByExercise('squat', 2)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2026-04-01')
      expect(result[1].date).toBe('2026-03-25')
    })
  })
})
