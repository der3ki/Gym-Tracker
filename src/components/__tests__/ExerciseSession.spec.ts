import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExerciseSession from '../ExerciseSession.vue'
import type { Exercise, SetLog, ExerciseTarget } from '@/types'

const mockExercise: Exercise = {
  id: 'e1',
  name: 'Sentadilla',
  type: 'strength',
  repRange: { min: 1, max: 6 },
  defaultSets: 4,
}

const maintainTarget: ExerciseTarget = {
  exerciseId: 'e1',
  targetWeight: 100,
  targetReps: 6,
  recommendation: 'Mantén 100kg x 6 reps.',
}

const increaseTarget: ExerciseTarget = {
  exerciseId: 'e1',
  targetWeight: 102.5,
  targetReps: 1,
  recommendation: 'Sube peso a 102.5kg (+2.5kg).',
}

const defaultSets: SetLog[] = [
  { reps: 0, weight: 0, rir: null },
  { reps: 0, weight: 0, rir: null },
  { reps: 0, weight: 0, rir: null },
  { reps: 0, weight: 0, rir: null },
]

describe('ExerciseSession', () => {
  it('should display exercise name and type badge', () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: { exercise: mockExercise, sessionData: defaultSets },
    })

    // Act
    const text = wrapper.text()

    // Assert
    expect(text).toContain('Sentadilla')
    expect(wrapper.find('.badge-strength').exists()).toBe(true)
  })

  it('should display rep range', () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: { exercise: mockExercise, sessionData: defaultSets },
    })

    // Act & Assert
    expect(wrapper.text()).toContain('1-6 reps')
  })

  it('should show target weight and reps when target is provided', () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: {
        exercise: mockExercise,
        target: increaseTarget,
        sessionData: defaultSets,
      },
    })

    // Act & Assert
    expect(wrapper.find('.target-value').text()).toContain('102.5kg x 1 reps')
    expect(wrapper.text()).toContain('Sube peso a 102.5kg')
  })

  it('should show recommendation text for maintain target', () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: {
        exercise: mockExercise,
        target: maintainTarget,
        sessionData: defaultSets,
      },
    })

    // Act & Assert
    expect(wrapper.text()).toContain('Mantén 100kg x 6 reps')
  })

  it('should not show recommendation when no target is provided', () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: { exercise: mockExercise, sessionData: defaultSets },
    })

    // Act & Assert
    expect(wrapper.find('.recommendation').exists()).toBe(false)
  })

  it('should render correct number of set rows', () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: { exercise: mockExercise, sessionData: defaultSets },
    })

    // Act & Assert
    expect(wrapper.findAll('.set-row')).toHaveLength(4)
  })

  it('should emit updateSets when input changes', async () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: { exercise: mockExercise, sessionData: defaultSets },
    })

    // Act
    const weightInput = wrapper.find('input[aria-label="Peso serie 1"]')
    await weightInput.setValue(100)

    // Assert
    expect(wrapper.emitted('updateSets')).toBeTruthy()
  })

  it('should add a set when clicking + Serie', async () => {
    // Arrange
    const wrapper = mount(ExerciseSession, {
      props: { exercise: mockExercise, sessionData: defaultSets },
    })

    // Act
    await wrapper.find('button.btn-ghost').trigger('click')

    // Assert
    expect(wrapper.findAll('.set-row')).toHaveLength(5)
    expect(wrapper.emitted('updateSets')).toBeTruthy()
  })
})
