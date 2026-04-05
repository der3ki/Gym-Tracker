import { describe, it, expect } from 'vitest'
import { createWeekGenerator } from '../useWeekGenerator'
import type { Exercise, CompletedExercise } from '@/types'

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
  repRange: { min: 6, max: 12 },
  defaultSets: 3,
}

describe('WeekGenerator', () => {
  const generator = createWeekGenerator()

  describe('generateFirstWeekTarget', () => {
    it('should return target with 0 weight and min reps for first week', () => {
      // Arrange & Act
      const target = generator.generateFirstWeekTarget(squatExercise)

      // Assert
      expect(target.exerciseId).toBe('squat-1')
      expect(target.targetWeight).toBe(0)
      expect(target.targetReps).toBe(1)
      expect(target.recommendation).toContain('Primera semana')
    })
  })

  describe('generateTargetsForExercise', () => {
    it('should return first week target when no previous data', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = []

      // Act
      const target = generator.generateTargetsForExercise(squatExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(0)
      expect(target.recommendation).toContain('Primera semana')
    })

    it('should suggest adding reps when not at top of range', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = [
        [{ exerciseId: 'squat-1', sets: [
          { reps: 4, weight: 100, rir: 2 },
          { reps: 4, weight: 100, rir: 2 },
        ]}],
      ]

      // Act
      const target = generator.generateTargetsForExercise(squatExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(100)
      expect(target.targetReps).toBe(5)
      expect(target.recommendation).toContain('Intenta llegar a 5 reps')
    })

    it('should suggest maintaining when at top reps but low RIR', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = [
        [{ exerciseId: 'squat-1', sets: [
          { reps: 6, weight: 100, rir: 1 },
          { reps: 6, weight: 100, rir: 0 },
        ]}],
      ]

      // Act
      const target = generator.generateTargetsForExercise(squatExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(100)
      expect(target.targetReps).toBe(6)
      expect(target.recommendation).toContain('RIR fue bajo')
    })

    it('should suggest maintaining when at top reps with good RIR but only 1 week', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = [
        [{ exerciseId: 'squat-1', sets: [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 3 },
        ]}],
      ]

      // Act
      const target = generator.generateTargetsForExercise(squatExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(100)
      expect(target.targetReps).toBe(6)
      expect(target.recommendation).toContain('Una semana más')
    })

    it('should suggest weight increase after 2 weeks at top reps with good RIR', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = [
        [{ exerciseId: 'squat-1', sets: [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 3 },
        ]}],
        [{ exerciseId: 'squat-1', sets: [
          { reps: 6, weight: 100, rir: 2 },
          { reps: 6, weight: 100, rir: 2 },
        ]}],
      ]

      // Act
      const target = generator.generateTargetsForExercise(squatExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(102.5)
      expect(target.targetReps).toBe(1)
      expect(target.recommendation).toContain('Sube peso a 102.5kg')
      expect(target.recommendation).toContain('+2.5kg')
    })

    it('should use correct increment for hypertrophy exercises', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = [
        [{ exerciseId: 'curl-1', sets: [
          { reps: 12, weight: 15, rir: 2 },
          { reps: 12, weight: 15, rir: 3 },
        ]}],
        [{ exerciseId: 'curl-1', sets: [
          { reps: 12, weight: 15, rir: 2 },
          { reps: 12, weight: 15, rir: 2 },
        ]}],
      ]

      // Act
      const target = generator.generateTargetsForExercise(curlExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(16)
      expect(target.targetReps).toBe(6)
      expect(target.recommendation).toContain('+1kg')
    })

    it('should not increase weight when weights differ between weeks', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = [
        [{ exerciseId: 'squat-1', sets: [
          { reps: 6, weight: 102.5, rir: 2 },
        ]}],
        [{ exerciseId: 'squat-1', sets: [
          { reps: 6, weight: 100, rir: 2 },
        ]}],
      ]

      // Act
      const target = generator.generateTargetsForExercise(squatExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(102.5)
      expect(target.recommendation).toContain('Una semana más')
    })

    it('should return first week target when exercise has no data in previous week', () => {
      // Arrange
      const previousWeeks: CompletedExercise[][] = [
        [{ exerciseId: 'other-exercise', sets: [
          { reps: 5, weight: 50, rir: 2 },
        ]}],
      ]

      // Act
      const target = generator.generateTargetsForExercise(squatExercise, previousWeeks)

      // Assert
      expect(target.targetWeight).toBe(0)
      expect(target.recommendation).toContain('Primera semana')
    })
  })
})
