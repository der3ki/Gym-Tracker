import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WorkoutLog, ExerciseLog } from '@/types'
import { getStorage } from '@/services/storage-registry'
import { getIdGenerator } from '@/services/id-generator-registry'

export const useWorkoutLogStore = defineStore('workoutLog', () => {
  const storage = getStorage<WorkoutLog>('workout-logs', '/api/workout-logs')
  const logs = ref<WorkoutLog[]>([])
  const loaded = ref(false)

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return
    logs.value = await storage.getAll()
    loaded.value = true
  }

  async function createLog(
    routineId: string,
    dayId: string,
    date: string,
    exercises: ExerciseLog[],
  ): Promise<WorkoutLog> {
    const log: WorkoutLog = {
      id: getIdGenerator().generate(),
      routineId,
      dayId,
      date,
      exercises,
    }
    logs.value.push(log)
    await storage.save(log)
    return log
  }

  async function deleteLog(logId: string): Promise<void> {
    logs.value = logs.value.filter((l) => l.id !== logId)
    await storage.remove(logId)
  }

  function getLogsByDay(dayId: string): WorkoutLog[] {
    return logs.value
      .filter((log) => log.dayId === dayId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  function getLogsByExercise(exerciseId: string): WorkoutLog[] {
    return logs.value
      .filter((log) => log.exercises.some((e) => e.exerciseId === exerciseId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  function getLastNLogsByExercise(exerciseId: string, n: number): WorkoutLog[] {
    return getLogsByExercise(exerciseId).slice(0, n)
  }

  function $reset(): void {
    logs.value = []
    loaded.value = false
  }

  return {
    logs,
    loaded,
    ensureLoaded,
    createLog,
    deleteLog,
    getLogsByDay,
    getLogsByExercise,
    getLastNLogsByExercise,
    $reset,
  }
})
