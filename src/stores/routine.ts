import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Routine, WorkoutDay, Exercise } from '@/types'
import { getStorage } from '@/services/storage-registry'
import { getIdGenerator } from '@/services/id-generator-registry'

export const useRoutineStore = defineStore('routine', () => {
  const storage = getStorage<Routine>('routines', '/api/routines')
  const routines = ref<Routine[]>([])
  const loaded = ref(false)

  const routineCount = computed(() => routines.value.length)

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return
    routines.value = await storage.getAll()
    loaded.value = true
  }

  function getRoutineById(routineId: string): Routine | undefined {
    return routines.value.find((r) => r.id === routineId)
  }

  async function createRoutine(name: string): Promise<Routine> {
    const now = new Date().toISOString()
    const routine: Routine = {
      id: getIdGenerator().generate(),
      name,
      days: [],
      createdAt: now,
      updatedAt: now,
    }
    routines.value.push(routine)
    await storage.save(routine)
    return routine
  }

  async function deleteRoutine(routineId: string): Promise<void> {
    routines.value = routines.value.filter((r) => r.id !== routineId)
    await storage.remove(routineId)
  }

  async function addDay(routineId: string, dayName: string): Promise<WorkoutDay | undefined> {
    const routine = routines.value.find((r) => r.id === routineId)
    if (!routine) return undefined

    const day: WorkoutDay = {
      id: getIdGenerator().generate(),
      name: dayName,
      exercises: [],
    }
    routine.days.push(day)
    routine.updatedAt = new Date().toISOString()
    await storage.save({ ...routine })
    return day
  }

  async function removeDay(routineId: string, dayId: string): Promise<void> {
    const routine = routines.value.find((r) => r.id === routineId)
    if (!routine) return

    routine.days = routine.days.filter((d) => d.id !== dayId)
    routine.updatedAt = new Date().toISOString()
    await storage.save({ ...routine })
  }

  async function addExerciseToDay(
    routineId: string,
    dayId: string,
    exercise: Exercise,
  ): Promise<void> {
    const routine = routines.value.find((r) => r.id === routineId)
    if (!routine) return

    const day = routine.days.find((d) => d.id === dayId)
    if (!day) return

    day.exercises.push(exercise)
    routine.updatedAt = new Date().toISOString()
    await storage.save({ ...routine })
  }

  async function removeExerciseFromDay(
    routineId: string,
    dayId: string,
    exerciseId: string,
  ): Promise<void> {
    const routine = routines.value.find((r) => r.id === routineId)
    if (!routine) return

    const day = routine.days.find((d) => d.id === dayId)
    if (!day) return

    day.exercises = day.exercises.filter((e) => e.id !== exerciseId)
    routine.updatedAt = new Date().toISOString()
    await storage.save({ ...routine })
  }

  function $reset(): void {
    routines.value = []
    loaded.value = false
  }

  return {
    routines,
    routineCount,
    loaded,
    ensureLoaded,
    getRoutineById,
    createRoutine,
    deleteRoutine,
    addDay,
    removeDay,
    addExerciseToDay,
    removeExerciseFromDay,
    $reset,
  }
})
