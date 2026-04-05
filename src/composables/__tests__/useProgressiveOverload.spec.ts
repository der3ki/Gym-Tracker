import { describe, it, expect } from 'vitest'
import { createOverloadAnalyzer } from '../useProgressiveOverload'
import type { Exercise, WorkoutLog } from '@/types'

const squatExercise: Exercise = {
  id: 'squat-1',
  name: 'Sentadilla',
  type: 'strength',
  repRange: { min: 1, max: 6 },
  defaultSets: 4,
}

const curlExercise: Exercise = {
  id: 'curl-1',
  name: 'Curl bíceps',
  type: 'hypertrophy',
  repRange: { min: 8, max: 12 },
  defaultSets: 3,
}

const facePullExercise: Exercise = {
  id: 'facepull-1',
  name: 'Face pull',
  type: 'endurance',
  repRange: { min: 15, max: 20 },
  defaultSets: 3,
}

function buildLog(
  date: string,
  exerciseId: string,
  sets: { reps: number; weight: number; rir: number | null }[],
): WorkoutLog {
  return {
    id: `log-${date}`,
    routineId: 'r1',
    dayId: 'd1',
    date,
    exercises: [{ exerciseId, sets }],
  }
}

describe('OverloadAnalyzer', () => {
  const analyzer = createOverloadAnalyzer()

  describe('insufficient data', () => {
    it('should return insufficient_data when less than 2 logs exist', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'squat-1', [
          { reps: 5, weight: 100, rir: 2 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(squatExercise, logs)

      // Assert
      expect(result.action).toBe('insufficient_data')
      expect(result.suggestedWeight).toBeNull()
    })

    it('should return insufficient_data when no logs exist', () => {
      // Arrange
      const logs: WorkoutLog[] = []

      // Act
      const result = analyzer.evaluate(squatExercise, logs)

      // Assert
      expect(result.action).toBe('insufficient_data')
    })
  })

  describe('strength exercises', () => {
    it('should recommend weight increase when top reps hit for 2 weeks with good RIR', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'squat-1', [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 3 },
          { reps: 6, weight: 100, rir: 2 },
        ]),
        buildLog('2026-03-25', 'squat-1', [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 3 },
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(squatExercise, logs)

      // Assert
      expect(result.action).toBe('increase_weight')
      expect(result.suggestedWeight).toBe(102.5)
      expect(result.currentWeight).toBe(100)
    })

    it('should recommend maintain when reps are not at top of range', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'squat-1', [
          { reps: 4, weight: 100, rir: 2 },
          { reps: 5, weight: 100, rir: 2 },
          { reps: 4, weight: 100, rir: 1 },
          { reps: 3, weight: 100, rir: 0 },
        ]),
        buildLog('2026-03-25', 'squat-1', [
          { reps: 5, weight: 100, rir: 2 },
          { reps: 5, weight: 100, rir: 2 },
          { reps: 5, weight: 100, rir: 2 },
          { reps: 5, weight: 100, rir: 2 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(squatExercise, logs)

      // Assert
      expect(result.action).toBe('maintain')
    })

    it('should recommend maintain when RIR is too low', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'squat-1', [
          { reps: 6, weight: 100, rir: 1 },
          { reps: 6, weight: 100, rir: 0 },
          { reps: 6, weight: 100, rir: 1 },
          { reps: 6, weight: 100, rir: 0 },
        ]),
        buildLog('2026-03-25', 'squat-1', [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(squatExercise, logs)

      // Assert
      expect(result.action).toBe('maintain')
    })

    it('should recommend maintain when weights differ between weeks', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'squat-1', [
          { reps: 5, weight: 102.5, rir: 2 },
          { reps: 5, weight: 102.5, rir: 2 },
        ]),
        buildLog('2026-03-25', 'squat-1', [
          { reps: 5, weight: 100, rir: 2 },
          { reps: 5, weight: 100, rir: 2 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(squatExercise, logs)

      // Assert
      expect(result.action).toBe('maintain')
    })
  })

  describe('hypertrophy exercises', () => {
    it('should recommend +1kg increment for hypertrophy exercises', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'curl-1', [
          { reps: 12, weight: 15, rir: 2 },
          { reps: 12, weight: 15, rir: 3 },
          { reps: 12, weight: 15, rir: 2 },
        ]),
        buildLog('2026-03-25', 'curl-1', [
          { reps: 12, weight: 15, rir: 2 },
          { reps: 12, weight: 15, rir: 2 },
          { reps: 12, weight: 15, rir: 3 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(curlExercise, logs)

      // Assert
      expect(result.action).toBe('increase_weight')
      expect(result.suggestedWeight).toBe(16)
    })
  })

  describe('endurance exercises', () => {
    it('should recommend +0.5kg increment for endurance exercises', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'facepull-1', [
          { reps: 20, weight: 10, rir: 2 },
          { reps: 20, weight: 10, rir: 3 },
          { reps: 20, weight: 10, rir: 2 },
        ]),
        buildLog('2026-03-25', 'facepull-1', [
          { reps: 20, weight: 10, rir: 2 },
          { reps: 20, weight: 10, rir: 2 },
          { reps: 20, weight: 10, rir: 3 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(facePullExercise, logs)

      // Assert
      expect(result.action).toBe('increase_weight')
      expect(result.suggestedWeight).toBe(10.5)
    })
  })

  describe('edge cases', () => {
    it('should handle null RIR as not ready to increase', () => {
      // Arrange
      const logs = [
        buildLog('2026-04-01', 'squat-1', [
          { reps: 5, weight: 100, rir: null },
          { reps: 5, weight: 100, rir: 2 },
        ]),
        buildLog('2026-03-25', 'squat-1', [
          { reps: 5, weight: 100, rir: 2 },
          { reps: 5, weight: 100, rir: 2 },
        ]),
      ]

      // Act
      const result = analyzer.evaluate(squatExercise, logs)

      // Assert
      expect(result.action).toBe('maintain')
    })
  })
})
