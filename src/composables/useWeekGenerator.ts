import type {
  Exercise,
  ExerciseTarget,
  WeekDayPlan,
  CompletedExercise,
} from '@/types'
import {
  WEIGHT_INCREMENT,
  MIN_CONSECUTIVE_WEEKS,
  GOOD_RIR_THRESHOLD,
} from '@/types'

export interface WeekGenerator {
  generateTargetsForExercise(
    exercise: Exercise,
    previousWeeksData: CompletedExercise[][],
  ): ExerciseTarget

  generateFirstWeekTarget(exercise: Exercise): ExerciseTarget
}

export function createWeekGenerator(): WeekGenerator {
  function generateFirstWeekTarget(exercise: Exercise): ExerciseTarget {
    return {
      exerciseId: exercise.id,
      targetWeight: 0,
      targetReps: exercise.repRange.min,
      recommendation: 'Primera semana: introduce el peso con el que quieras empezar.',
    }
  }

  function generateTargetsForExercise(
    exercise: Exercise,
    previousWeeksData: CompletedExercise[][],
  ): ExerciseTarget {
    if (previousWeeksData.length === 0) {
      return generateFirstWeekTarget(exercise)
    }

    const lastWeekData = previousWeeksData[0]
    const lastWeekExercise = lastWeekData.find((e) => e.exerciseId === exercise.id)

    if (!lastWeekExercise || lastWeekExercise.sets.length === 0) {
      return generateFirstWeekTarget(exercise)
    }

    const lastSets = lastWeekExercise.sets
    const lastWeight = Math.max(...lastSets.map((s) => s.weight))
    const lastMaxReps = Math.max(...lastSets.map((s) => s.reps))
    const allAtTopOfRange = lastSets.every((s) => s.reps >= exercise.repRange.max)
    const allGoodRir = lastSets.every((s) => s.rir !== null && s.rir >= GOOD_RIR_THRESHOLD)

    if (previousWeeksData.length >= MIN_CONSECUTIVE_WEEKS) {
      const prevWeekData = previousWeeksData[1]
      const prevWeekExercise = prevWeekData?.find((e) => e.exerciseId === exercise.id)

      if (prevWeekExercise && prevWeekExercise.sets.length > 0) {
        const prevSets = prevWeekExercise.sets
        const prevWeight = Math.max(...prevSets.map((s) => s.weight))
        const prevAllAtTop = prevSets.every((s) => s.reps >= exercise.repRange.max)
        const prevAllGoodRir = prevSets.every(
          (s) => s.rir !== null && s.rir >= GOOD_RIR_THRESHOLD,
        )

        if (
          allAtTopOfRange &&
          allGoodRir &&
          prevAllAtTop &&
          prevAllGoodRir &&
          lastWeight === prevWeight
        ) {
          const increment = WEIGHT_INCREMENT[exercise.type]
          const newWeight = lastWeight + increment
          return {
            exerciseId: exercise.id,
            targetWeight: newWeight,
            targetReps: exercise.repRange.min,
            recommendation:
              `Sube peso a ${newWeight}kg (+${increment}kg). ` +
              `Llegaste al tope del rango (${exercise.repRange.max} reps) 2 semanas seguidas con buen RIR. ` +
              `Empieza con ${exercise.repRange.min} reps al nuevo peso.`,
          }
        }
      }
    }

    if (allAtTopOfRange && !allGoodRir) {
      return {
        exerciseId: exercise.id,
        targetWeight: lastWeight,
        targetReps: exercise.repRange.max,
        recommendation:
          `Mantén ${lastWeight}kg x ${exercise.repRange.max} reps. ` +
          `Llegaste al tope de reps pero el RIR fue bajo. Repite hasta que sea más cómodo (RIR >= ${GOOD_RIR_THRESHOLD}).`,
      }
    }

    if (lastMaxReps < exercise.repRange.max) {
      const nextReps = Math.min(lastMaxReps + 1, exercise.repRange.max)
      return {
        exerciseId: exercise.id,
        targetWeight: lastWeight,
        targetReps: nextReps,
        recommendation:
          `Mantén ${lastWeight}kg. Intenta llegar a ${nextReps} reps ` +
          `(la semana pasada hiciste ${lastMaxReps}).`,
      }
    }

    return {
      exerciseId: exercise.id,
      targetWeight: lastWeight,
      targetReps: exercise.repRange.max,
      recommendation:
        `Mantén ${lastWeight}kg x ${exercise.repRange.max} reps. ` +
        `Una semana más así con buen RIR y podrás subir peso.`,
    }
  }

  return {
    generateFirstWeekTarget,
    generateTargetsForExercise,
  }
}
