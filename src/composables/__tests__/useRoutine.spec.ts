import { describe, it, expect, beforeEach } from 'vitest'
import { useRoutine } from '../useRoutine'
import { LocalStorageAdapter } from '@/services/storage'
import type { Routine } from '@/types'
import type { IdGenerator } from '@/services/id-generator'
import { createExerciseFactory } from '../useExerciseFactory'

let idCounter: number

const sequentialIdGenerator: IdGenerator = {
  generate: () => `id-${++idCounter}`,
}

describe('useRoutine', () => {
  let storage: LocalStorageAdapter<Routine>

  beforeEach(() => {
    idCounter = 0
    storage = new LocalStorageAdapter<Routine>('test-routines')
  })

  describe('createRoutine', () => {
    it('should create a routine and persist it', async () => {
      // Arrange
      const { createRoutine, routines } = useRoutine(storage, sequentialIdGenerator)

      // Act
      const routine = await createRoutine('Push Pull Legs')

      // Assert
      expect(routine.name).toBe('Push Pull Legs')
      expect(routine.days).toEqual([])
      expect(routines.value).toHaveLength(1)
      expect(storage.getAll()).toHaveLength(1)
    })

    it('should create multiple routines', async () => {
      // Arrange
      const { createRoutine, routineCount } = useRoutine(storage, sequentialIdGenerator)

      // Act
      await createRoutine('Rutina A')
      await createRoutine('Rutina B')

      // Assert
      expect(routineCount.value).toBe(2)
    })
  })

  describe('deleteRoutine', () => {
    it('should remove a routine by id', async () => {
      // Arrange
      const { createRoutine, deleteRoutine, routines } = useRoutine(storage, sequentialIdGenerator)
      const routine = await createRoutine('To Delete')

      // Act
      await deleteRoutine(routine.id)

      // Assert
      expect(routines.value).toHaveLength(0)
      expect(storage.getAll()).toHaveLength(0)
    })
  })

  describe('addDay', () => {
    it('should add a day to an existing routine', async () => {
      // Arrange
      const { createRoutine, addDay, getRoutineById } = useRoutine(storage, sequentialIdGenerator)
      const routine = await createRoutine('Powerbuilding')

      // Act
      const day = await addDay(routine.id, 'Día 1 - Upper')

      // Assert
      expect(day).toBeDefined()
      expect(day!.name).toBe('Día 1 - Upper')
      const updated = getRoutineById(routine.id)
      expect(updated!.days).toHaveLength(1)
    })

    it('should return undefined for non-existent routine', async () => {
      // Arrange
      const { addDay } = useRoutine(storage, sequentialIdGenerator)

      // Act
      const result = await addDay('non-existent', 'Day 1')

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('removeDay', () => {
    it('should remove a day from a routine', async () => {
      // Arrange
      const { createRoutine, addDay, removeDay, getRoutineById } = useRoutine(
        storage,
        sequentialIdGenerator,
      )
      const routine = await createRoutine('Test')
      const day = (await addDay(routine.id, 'Día 1'))!

      // Act
      await removeDay(routine.id, day.id)

      // Assert
      const updated = getRoutineById(routine.id)
      expect(updated!.days).toHaveLength(0)
    })
  })

  describe('addExerciseToDay', () => {
    it('should add an exercise to a specific day', async () => {
      // Arrange
      const { createRoutine, addDay, addExerciseToDay, getRoutineById } = useRoutine(
        storage,
        sequentialIdGenerator,
      )
      const factory = createExerciseFactory(sequentialIdGenerator)
      const routine = await createRoutine('Test')
      const day = (await addDay(routine.id, 'Día 1'))!
      const exercise = factory.create('Press Banca', 'strength')

      // Act
      await addExerciseToDay(routine.id, day.id, exercise)

      // Assert
      const updated = getRoutineById(routine.id)
      const updatedDay = updated!.days.find((d) => d.id === day.id)
      expect(updatedDay!.exercises).toHaveLength(1)
      expect(updatedDay!.exercises[0].name).toBe('Press Banca')
    })
  })

  describe('removeExerciseFromDay', () => {
    it('should remove an exercise from a day', async () => {
      // Arrange
      const { createRoutine, addDay, addExerciseToDay, removeExerciseFromDay, getRoutineById } =
        useRoutine(storage, sequentialIdGenerator)
      const factory = createExerciseFactory(sequentialIdGenerator)
      const routine = await createRoutine('Test')
      const day = (await addDay(routine.id, 'Día 1'))!
      const exercise = factory.create('Sentadilla', 'strength')
      await addExerciseToDay(routine.id, day.id, exercise)

      // Act
      await removeExerciseFromDay(routine.id, day.id, exercise.id)

      // Assert
      const updated = getRoutineById(routine.id)
      const updatedDay = updated!.days.find((d) => d.id === day.id)
      expect(updatedDay!.exercises).toHaveLength(0)
    })
  })
})
