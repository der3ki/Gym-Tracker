import { ref } from 'vue'
import type { WorkoutLog, ExerciseLog } from '@/types'
import type { StoragePort } from '@/services/storage'
import { createStorage } from '@/services/storage-provider'
import type { IdGenerator } from '@/services/id-generator'
import { cryptoIdGenerator } from '@/services/id-generator'

export function useWorkoutLog(
  storage: StoragePort<WorkoutLog> = createStorage<WorkoutLog>('workout-logs', '/api/workout-logs'),
  idGenerator: IdGenerator = cryptoIdGenerator,
) {
  const logs = ref<WorkoutLog[]>([])

  async function init(): Promise<void> {
    logs.value = await storage.getAll()
  }

  async function createLog(
    routineId: string,
    dayId: string,
    date: string,
    exercises: ExerciseLog[],
  ): Promise<WorkoutLog> {
    const log: WorkoutLog = {
      id: idGenerator.generate(),
      routineId,
      dayId,
      date,
      exercises,
    }
    await storage.save(log)
    logs.value = await storage.getAll()
    return log
  }

  async function deleteLog(logId: string): Promise<void> {
    await storage.remove(logId)
    logs.value = await storage.getAll()
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

  return {
    logs,
    init,
    createLog,
    deleteLog,
    getLogsByDay,
    getLogsByExercise,
    getLastNLogsByExercise,
  }
}
