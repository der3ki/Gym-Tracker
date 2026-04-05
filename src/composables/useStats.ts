import type { TrainingWeek, Routine } from '@/types'
import type { StoragePort } from '@/services/storage'
import { createStorage } from '@/services/storage-provider'

export interface WeekDataPoint {
  weekNumber: number
  maxWeight: number
  volume: number
}

export interface ExerciseProgression {
  exerciseId: string
  exerciseName: string
  dataPoints: WeekDataPoint[]
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  weekNumber: number
  routineName: string
}

export function useStats(
  weekStorage: StoragePort<TrainingWeek> = createStorage<TrainingWeek>('training-weeks', '/api/training-weeks'),
  routineStorage: StoragePort<Routine> = createStorage<Routine>('routines', '/api/routines'),
) {
  async function getPersonalRecords(): Promise<PersonalRecord[]> {
    const weeks = await weekStorage.getAll()
    const routines = await routineStorage.getAll()
    const prMap = new Map<string, PersonalRecord>()

    for (const week of weeks) {
      const routine = routines.find((r) => r.id === week.routineId)
      if (!routine) continue

      for (const day of week.days) {
        for (const completed of day.completedExercises) {
          for (const set of completed.sets) {
            const current = prMap.get(completed.exerciseId)
            if (!current || set.weight > current.weight) {
              prMap.set(completed.exerciseId, {
                exerciseId: completed.exerciseId,
                exerciseName: resolveExerciseName(routine, day.dayId, completed.exerciseId),
                weight: set.weight,
                reps: set.reps,
                weekNumber: week.weekNumber,
                routineName: routine.name,
              })
            }
          }
        }
      }
    }

    return Array.from(prMap.values()).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
  }

  function resolveExerciseName(routine: Routine, dayId: string, exerciseId: string): string {
    const day = routine.days.find((d) => d.id === dayId)
    const exercise = day?.exercises.find((e) => e.id === exerciseId)
    return exercise?.name ?? exerciseId
  }

  async function getExerciseProgressions(routineId: string): Promise<ExerciseProgression[]> {
    const allWeeks = await weekStorage.getAll()
    const weeks = allWeeks
      .filter((w) => w.routineId === routineId)
      .sort((a, b) => a.weekNumber - b.weekNumber)
    const allRoutines = await routineStorage.getAll()
    const routine = allRoutines.find((r) => r.id === routineId)
    if (!routine || weeks.length === 0) return []

    const progressionMap = new Map<string, ExerciseProgression>()

    for (const week of weeks) {
      for (const day of week.days) {
        for (const completed of day.completedExercises) {
          if (completed.sets.length === 0) continue

          if (!progressionMap.has(completed.exerciseId)) {
            progressionMap.set(completed.exerciseId, {
              exerciseId: completed.exerciseId,
              exerciseName: resolveExerciseName(routine, day.dayId, completed.exerciseId),
              dataPoints: [],
            })
          }

          const maxWeight = Math.max(...completed.sets.map((s) => s.weight))
          const volume = completed.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

          progressionMap.get(completed.exerciseId)!.dataPoints.push({
            weekNumber: week.weekNumber,
            maxWeight,
            volume,
          })
        }
      }
    }

    return Array.from(progressionMap.values()).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
  }

  return {
    getPersonalRecords,
    getExerciseProgressions,
  }
}
