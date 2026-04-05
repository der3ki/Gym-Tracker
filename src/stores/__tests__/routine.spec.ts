import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRoutineStore } from '../routine'
import { LocalStorageAdapter } from '@/services/storage'
import { setStorageOverride, resetStorageRegistry } from '@/services/storage-registry'
import { setIdGeneratorOverride, resetIdGeneratorOverride } from '@/services/id-generator-registry'
import type { Routine } from '@/types'
import { createExerciseFactory } from '@/composables/useExerciseFactory'

let idCounter: number

const sequentialIdGenerator = {
  generate: () => `id-${++idCounter}`,
}

describe('routineStore', () => {
  beforeEach(() => {
    idCounter = 0
    setActivePinia(createPinia())
    const storage = new LocalStorageAdapter<Routine>('test-routines')
    setStorageOverride('routines', storage)
    setIdGeneratorOverride(sequentialIdGenerator)
  })

  beforeEach(() => {
    return () => {
      resetStorageRegistry()
      resetIdGeneratorOverride()
    }
  })

  describe('createRoutine', () => {
    it('should create a routine and persist it', async () => {
      // Arrange
      const store = useRoutineStore()

      // Act
      const routine = await store.createRoutine('Push Pull Legs')

      // Assert
      expect(routine.name).toBe('Push Pull Legs')
      expect(routine.days).toEqual([])
      expect(store.routines).toHaveLength(1)
    })

    it('should create multiple routines', async () => {
      // Arrange
      const store = useRoutineStore()

      // Act
      await store.createRoutine('Rutina A')
      await store.createRoutine('Rutina B')

      // Assert
      expect(store.routineCount).toBe(2)
    })
  })

  describe('deleteRoutine', () => {
    it('should remove a routine by id', async () => {
      // Arrange
      const store = useRoutineStore()
      const routine = await store.createRoutine('To Delete')

      // Act
      await store.deleteRoutine(routine.id)

      // Assert
      expect(store.routines).toHaveLength(0)
    })
  })

  describe('addDay', () => {
    it('should add a day to an existing routine', async () => {
      // Arrange
      const store = useRoutineStore()
      const routine = await store.createRoutine('Powerbuilding')

      // Act
      const day = await store.addDay(routine.id, 'Día 1 - Upper')

      // Assert
      expect(day).toBeDefined()
      expect(day!.name).toBe('Día 1 - Upper')
      const updated = store.getRoutineById(routine.id)
      expect(updated!.days).toHaveLength(1)
    })

    it('should return undefined for non-existent routine', async () => {
      // Arrange
      const store = useRoutineStore()

      // Act
      const result = await store.addDay('non-existent', 'Day 1')

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('removeDay', () => {
    it('should remove a day from a routine', async () => {
      // Arrange
      const store = useRoutineStore()
      const routine = await store.createRoutine('Test')
      const day = (await store.addDay(routine.id, 'Día 1'))!

      // Act
      await store.removeDay(routine.id, day.id)

      // Assert
      const updated = store.getRoutineById(routine.id)
      expect(updated!.days).toHaveLength(0)
    })
  })

  describe('addExerciseToDay', () => {
    it('should add an exercise to a specific day', async () => {
      // Arrange
      const store = useRoutineStore()
      const factory = createExerciseFactory(sequentialIdGenerator)
      const routine = await store.createRoutine('Test')
      const day = (await store.addDay(routine.id, 'Día 1'))!
      const exercise = factory.create('Press Banca', 'strength')

      // Act
      await store.addExerciseToDay(routine.id, day.id, exercise)

      // Assert
      const updated = store.getRoutineById(routine.id)
      const updatedDay = updated!.days.find((d) => d.id === day.id)
      expect(updatedDay!.exercises).toHaveLength(1)
      expect(updatedDay!.exercises[0].name).toBe('Press Banca')
    })
  })

  describe('removeExerciseFromDay', () => {
    it('should remove an exercise from a day', async () => {
      // Arrange
      const store = useRoutineStore()
      const factory = createExerciseFactory(sequentialIdGenerator)
      const routine = await store.createRoutine('Test')
      const day = (await store.addDay(routine.id, 'Día 1'))!
      const exercise = factory.create('Sentadilla', 'strength')
      await store.addExerciseToDay(routine.id, day.id, exercise)

      // Act
      await store.removeExerciseFromDay(routine.id, day.id, exercise.id)

      // Assert
      const updated = store.getRoutineById(routine.id)
      const updatedDay = updated!.days.find((d) => d.id === day.id)
      expect(updatedDay!.exercises).toHaveLength(0)
    })
  })
})
