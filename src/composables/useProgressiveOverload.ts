import type { Exercise, WorkoutLog, ExerciseLog, SetLog } from '@/types'
import type { OverloadRecommendation } from '@/types'
import {
  WEIGHT_INCREMENT,
  MIN_CONSECUTIVE_WEEKS,
  GOOD_RIR_THRESHOLD,
} from '@/types'

export interface OverloadAnalyzer {
  evaluate(exercise: Exercise, recentLogs: WorkoutLog[]): OverloadRecommendation
}

function findExerciseLog(log: WorkoutLog, exerciseId: string): ExerciseLog | undefined {
  return log.exercises.find((e) => e.exerciseId === exerciseId)
}

function getMaxWeight(sets: SetLog[]): number {
  return Math.max(...sets.map((s) => s.weight))
}

function allSetsAtTopOfRange(sets: SetLog[], maxReps: number): boolean {
  return sets.every((s) => s.reps >= maxReps)
}

function allSetsWithGoodRir(sets: SetLog[]): boolean {
  return sets.every((s) => s.rir !== null && s.rir >= GOOD_RIR_THRESHOLD)
}

export function createOverloadAnalyzer(): OverloadAnalyzer {
  return {
    evaluate(exercise: Exercise, recentLogs: WorkoutLog[]): OverloadRecommendation {
      const exerciseLogs = recentLogs
        .map((log) => ({
          date: log.date,
          exerciseLog: findExerciseLog(log, exercise.id),
        }))
        .filter((entry) => entry.exerciseLog !== undefined)
        .map((entry) => entry as { date: string; exerciseLog: ExerciseLog })

      if (exerciseLogs.length < MIN_CONSECUTIVE_WEEKS) {
        return {
          exerciseId: exercise.id,
          action: 'insufficient_data',
          currentWeight: 0,
          suggestedWeight: null,
          reason: `Se necesitan al menos ${MIN_CONSECUTIVE_WEEKS} sesiones registradas para hacer una recomendación.`,
        }
      }

      const lastTwoWeeks = exerciseLogs.slice(0, MIN_CONSECUTIVE_WEEKS)
      const currentWeight = getMaxWeight(lastTwoWeeks[0].exerciseLog.sets)
      const maxReps = exercise.repRange.max

      const bothWeeksAtTop = lastTwoWeeks.every((week) =>
        allSetsAtTopOfRange(week.exerciseLog.sets, maxReps),
      )

      const bothWeeksGoodRir = lastTwoWeeks.every((week) =>
        allSetsWithGoodRir(week.exerciseLog.sets),
      )

      const sameWeightBothWeeks = lastTwoWeeks.every(
        (week) => getMaxWeight(week.exerciseLog.sets) === currentWeight,
      )

      if (bothWeeksAtTop && bothWeeksGoodRir && sameWeightBothWeeks) {
        const increment = WEIGHT_INCREMENT[exercise.type]
        const suggestedWeight = currentWeight + increment
        return {
          exerciseId: exercise.id,
          action: 'increase_weight',
          currentWeight,
          suggestedWeight,
          reason:
            `Has alcanzado ${maxReps} reps en todas las series durante ${MIN_CONSECUTIVE_WEEKS} semanas ` +
            `con RIR ≥ ${GOOD_RIR_THRESHOLD}. Sube a ${suggestedWeight}kg (+${increment}kg).`,
        }
      }

      return {
        exerciseId: exercise.id,
        action: 'maintain',
        currentWeight,
        suggestedWeight: null,
        reason: 'Mantén el peso actual. Aún no cumples los criterios para subir.',
      }
    },
  }
}
