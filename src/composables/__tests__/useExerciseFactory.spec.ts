import { describe, it, expect } from 'vitest'
import { createExerciseFactory } from '../useExerciseFactory'
import type { IdGenerator } from '@/services/id-generator'
import { STRENGTH_REP_RANGE, HYPERTROPHY_REP_RANGE, ENDURANCE_REP_RANGE } from '@/types'

const fakeIdGenerator: IdGenerator = {
  generate: () => 'fake-id',
}

describe('ExerciseFactory', () => {
  it('should create a strength exercise with correct rep range', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const exercise = factory.create('Sentadilla', 'strength')

    // Assert
    expect(exercise).toEqual({
      id: 'fake-id',
      name: 'Sentadilla',
      type: 'strength',
      repRange: STRENGTH_REP_RANGE,
      defaultSets: 4,
    })
  })

  it('should create a hypertrophy exercise with correct rep range', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const exercise = factory.create('Curl bíceps', 'hypertrophy')

    // Assert
    expect(exercise).toEqual({
      id: 'fake-id',
      name: 'Curl bíceps',
      type: 'hypertrophy',
      repRange: HYPERTROPHY_REP_RANGE,
      defaultSets: 3,
    })
  })

  it('should create an endurance exercise with correct rep range', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const exercise = factory.create('Extensiones de tríceps', 'endurance')

    // Assert
    expect(exercise).toEqual({
      id: 'fake-id',
      name: 'Extensiones de tríceps',
      type: 'endurance',
      repRange: ENDURANCE_REP_RANGE,
      defaultSets: 3,
    })
  })

  it('should use custom rep range when within bounds', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const exercise = factory.create('Press militar', 'hypertrophy', { min: 8, max: 10 })

    // Assert
    expect(exercise.repRange).toEqual({ min: 8, max: 10 })
  })

  it('should clamp custom rep range to type bounds', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act — trying to set strength exercise with min 0 and max 12
    const exercise = factory.create('Sentadilla', 'strength', { min: 0, max: 12 })

    // Assert — clamped to strength bounds (1-6)
    expect(exercise.repRange).toEqual({ min: 1, max: 6 })
  })

  it('should clamp hypertrophy min to floor of 6', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const exercise = factory.create('Curl', 'hypertrophy', { min: 3, max: 10 })

    // Assert
    expect(exercise.repRange).toEqual({ min: 6, max: 10 })
  })

  it('should clamp endurance max to ceiling of 20', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const exercise = factory.create('Elevaciones', 'endurance', { min: 15, max: 30 })

    // Assert
    expect(exercise.repRange).toEqual({ min: 15, max: 20 })
  })

  it('should return default rep range for all types via getDefaultRepRange', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act & Assert
    expect(factory.getDefaultRepRange('strength')).toEqual(STRENGTH_REP_RANGE)
    expect(factory.getDefaultRepRange('hypertrophy')).toEqual(HYPERTROPHY_REP_RANGE)
    expect(factory.getDefaultRepRange('endurance')).toEqual(ENDURANCE_REP_RANGE)
  })

  it('should expose clampRepRange for external validation', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const clamped = factory.clampRepRange('strength', { min: -5, max: 100 })

    // Assert
    expect(clamped).toEqual({ min: 1, max: 6 })
  })

  it('should use custom number of sets when provided', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const exercise = factory.create('Sentadilla', 'strength', undefined, 6)

    // Assert
    expect(exercise.defaultSets).toBe(6)
  })

  it('should use default sets when not provided', () => {
    // Arrange
    const factory = createExerciseFactory(fakeIdGenerator)

    // Act
    const strength = factory.create('Sentadilla', 'strength')
    const hypertrophy = factory.create('Curl', 'hypertrophy')
    const endurance = factory.create('Face pull', 'endurance')

    // Assert
    expect(strength.defaultSets).toBe(4)
    expect(hypertrophy.defaultSets).toBe(3)
    expect(endurance.defaultSets).toBe(3)
  })
})
