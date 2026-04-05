import { defineStore } from 'pinia'
import type { Routine } from '@/types'
import { useRoutineStore } from './routine'
import { useTrainingWeekStore } from './trainingWeek'

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

export const useStatsStore = defineStore('stats', () => {
  const routineStore = useRoutineStore()
  const weekStore = useTrainingWeekStore()

  function resolveExerciseName(routine: Routine, dayId: string, exerciseId: string): string {
    const day = routine.days.find((d) => d.id === dayId)
    const exercise = day?.exercises.find((e) => e.id === exerciseId)
    return exercise?.name ?? exerciseId
  }

  async function getPersonalRecords(): Promise<PersonalRecord[]> {
    await Promise.all([routineStore.ensureLoaded(), weekStore.ensureLoaded()])

    const prMap = new Map<string, PersonalRecord>()

    for (const week of weekStore.weeks) {
      const routine = routineStore.routines.find((r) => r.id === week.routineId)
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

  async function getExerciseProgressions(routineId: string): Promise<ExerciseProgression[]> {
    await Promise.all([routineStore.ensureLoaded(), weekStore.ensureLoaded()])

    const weeks = weekStore.weeks
      .filter((w) => w.routineId === routineId)
      .sort((a, b) => a.weekNumber - b.weekNumber)
    const routine = routineStore.routines.find((r) => r.id === routineId)
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
})
