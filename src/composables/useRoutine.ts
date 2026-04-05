import { ref, computed } from 'vue'
import type { Routine, WorkoutDay, Exercise } from '@/types'
import type { StoragePort } from '@/services/storage'
import { createStorage } from '@/services/storage-provider'
import type { IdGenerator } from '@/services/id-generator'
import { cryptoIdGenerator } from '@/services/id-generator'

export function useRoutine(
  storage: StoragePort<Routine> = createStorage<Routine>('routines', '/api/routines'),
  idGenerator: IdGenerator = cryptoIdGenerator,
) {
  const routines = ref<Routine[]>([])

  const routineCount = computed(() => routines.value.length)

  async function init(): Promise<void> {
    routines.value = await storage.getAll()
  }

  async function createRoutine(name: string): Promise<Routine> {
    const now = new Date().toISOString()
    const routine: Routine = {
      id: idGenerator.generate(),
      name,
      days: [],
      createdAt: now,
      updatedAt: now,
    }
    await storage.save(routine)
    routines.value = await storage.getAll()
    return routine
  }

  async function deleteRoutine(routineId: string): Promise<void> {
    await storage.remove(routineId)
    routines.value = await storage.getAll()
  }

  async function addDay(routineId: string, dayName: string): Promise<WorkoutDay | undefined> {
    const routine = await storage.getById(routineId)
    if (!routine) return undefined

    const day: WorkoutDay = {
      id: idGenerator.generate(),
      name: dayName,
      exercises: [],
    }
    routine.days.push(day)
    routine.updatedAt = new Date().toISOString()
    await storage.save(routine)
    routines.value = await storage.getAll()
    return day
  }

  async function removeDay(routineId: string, dayId: string): Promise<void> {
    const routine = await storage.getById(routineId)
    if (!routine) return

    routine.days = routine.days.filter((d) => d.id !== dayId)
    routine.updatedAt = new Date().toISOString()
    await storage.save(routine)
    routines.value = await storage.getAll()
  }

  async function addExerciseToDay(
    routineId: string,
    dayId: string,
    exercise: Exercise,
  ): Promise<void> {
    const routine = await storage.getById(routineId)
    if (!routine) return

    const day = routine.days.find((d) => d.id === dayId)
    if (!day) return

    day.exercises.push(exercise)
    routine.updatedAt = new Date().toISOString()
    await storage.save(routine)
    routines.value = await storage.getAll()
  }

  async function removeExerciseFromDay(
    routineId: string,
    dayId: string,
    exerciseId: string,
  ): Promise<void> {
    const routine = await storage.getById(routineId)
    if (!routine) return

    const day = routine.days.find((d) => d.id === dayId)
    if (!day) return

    day.exercises = day.exercises.filter((e) => e.id !== exerciseId)
    routine.updatedAt = new Date().toISOString()
    await storage.save(routine)
    routines.value = await storage.getAll()
  }

  function getRoutineById(routineId: string): Routine | undefined {
    return routines.value.find((r) => r.id === routineId)
  }

  return {
    routines,
    routineCount,
    init,
    createRoutine,
    deleteRoutine,
    addDay,
    removeDay,
    addExerciseToDay,
    removeExerciseFromDay,
    getRoutineById,
  }
}
