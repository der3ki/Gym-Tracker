import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DayCard from '../DayCard.vue'
import type { WorkoutDay } from '@/types'

const mockDay: WorkoutDay = {
  id: 'd1',
  name: 'Día 1 - Upper',
  exercises: [
    { id: 'e1', name: 'Press Banca', type: 'strength', category: 'pecho', repRange: { min: 1, max: 6 }, defaultSets: 4 },
    { id: 'e2', name: 'Curl bíceps', type: 'hypertrophy', category: 'biceps', repRange: { min: 8, max: 12 }, defaultSets: 3 },
    { id: 'e3', name: 'Face pull', type: 'endurance', repRange: { min: 15, max: 20 }, defaultSets: 3 },
  ],
}

function getSelect(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.find(`select[aria-label="${label}"]`)
}

describe('DayCard', () => {
  it('should display day name and all exercises', () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    const text = wrapper.text()

    // Assert
    expect(text).toContain('Día 1 - Upper')
    expect(text).toContain('Press Banca')
    expect(text).toContain('Curl bíceps')
    expect(text).toContain('Face pull')
  })

  it('should show category badge when exercise has category', () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    const categoryBadges = wrapper.findAll('.badge-category')

    // Assert
    expect(categoryBadges).toHaveLength(2)
    expect(categoryBadges[0].text()).toBe('Pecho')
    expect(categoryBadges[1].text()).toBe('Bíceps')
  })

  it('should show correct type badges for all exercise types', () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    const text = wrapper.text()

    // Assert
    expect(text).toContain('Fuerza')
    expect(text).toContain('Hipertrofia')
    expect(text).toContain('Resistencia')
  })

  it('should show rep ranges for exercises', () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    const text = wrapper.text()

    // Assert
    expect(text).toContain('4x1-6')
    expect(text).toContain('3x8-12')
    expect(text).toContain('3x15-20')
  })

  it('should emit removeDay when delete button is clicked', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.card-header .btn-danger').trigger('click')

    // Assert
    expect(wrapper.emitted('removeDay')).toBeTruthy()
    expect(wrapper.emitted('removeDay')![0]).toEqual(['d1'])
  })

  it('should show add exercise form with category and exercise selects', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')

    // Assert
    expect(wrapper.find('.add-exercise-form').exists()).toBe(true)
    expect(getSelect(wrapper, 'Categoria muscular').exists()).toBe(true)
    expect(getSelect(wrapper, 'Ejercicio').exists()).toBe(true)
    expect(getSelect(wrapper, 'Tipo de ejercicio').exists()).toBe(true)
  })

  it('should disable exercise select when no category is selected', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')

    // Assert
    const exerciseSelect = getSelect(wrapper, 'Ejercicio')
    expect((exerciseSelect.element as HTMLSelectElement).disabled).toBe(true)
  })

  it('should show exercises for selected category', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')
    await getSelect(wrapper, 'Categoria muscular').setValue('pecho')

    // Assert
    const exerciseSelect = getSelect(wrapper, 'Ejercicio')
    const options = exerciseSelect.findAll('option')
    expect(options.length).toBeGreaterThan(1)
    expect(options.map((o) => o.text())).toContain('Press banca')
    expect(options.map((o) => o.text())).toContain('Aperturas')
  })

  it('should emit addExercise with category and exercise name', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')
    await getSelect(wrapper, 'Categoria muscular').setValue('espalda')
    await getSelect(wrapper, 'Ejercicio').setValue('Peso muerto')
    await wrapper.find('.add-exercise-form').trigger('submit')

    // Assert
    expect(wrapper.emitted('addExercise')).toBeTruthy()
    expect(wrapper.emitted('addExercise')![0]).toEqual([
      'd1', 'Peso muerto', 'strength', { min: 1, max: 6 }, 4, 'espalda',
    ])
  })

  it('should emit addExercise with custom rep range and type', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')
    await getSelect(wrapper, 'Categoria muscular').setValue('hombros')
    await getSelect(wrapper, 'Ejercicio').setValue('Press militar')
    await getSelect(wrapper, 'Tipo de ejercicio').setValue('hypertrophy')
    await wrapper.find('input[aria-label="Reps minimas"]').setValue(8)
    await wrapper.find('input[aria-label="Reps maximas"]').setValue(10)
    await wrapper.find('.add-exercise-form').trigger('submit')

    // Assert
    expect(wrapper.emitted('addExercise')).toBeTruthy()
    expect(wrapper.emitted('addExercise')![0]).toEqual([
      'd1', 'Press militar', 'hypertrophy', { min: 8, max: 10 }, 4, 'hombros',
    ])
  })

  it('should update rep range defaults when type changes', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')
    await getSelect(wrapper, 'Tipo de ejercicio').setValue('endurance')

    // Assert
    const minInput = wrapper.find<HTMLInputElement>('input[aria-label="Reps minimas"]')
    const maxInput = wrapper.find<HTMLInputElement>('input[aria-label="Reps maximas"]')
    expect(minInput.element.value).toBe('12')
    expect(maxInput.element.value).toBe('20')
  })

  it('should show allowed range hint for selected type', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')
    await getSelect(wrapper, 'Tipo de ejercicio').setValue('endurance')

    // Assert
    expect(wrapper.text()).toContain('Permitido: 12-20 reps')
  })

  it('should emit addExercise with custom number of sets', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')
    await getSelect(wrapper, 'Categoria muscular').setValue('cuadriceps')
    await getSelect(wrapper, 'Ejercicio').setValue('Sentadilla')
    await wrapper.find('input[aria-label="Numero de series"]').setValue(6)
    await wrapper.find('.add-exercise-form').trigger('submit')

    // Assert
    expect(wrapper.emitted('addExercise')).toBeTruthy()
    expect(wrapper.emitted('addExercise')![0]).toEqual([
      'd1', 'Sentadilla', 'strength', { min: 1, max: 6 }, 6, 'cuadriceps',
    ])
  })

  it('should reset exercise select when category changes', async () => {
    // Arrange
    const wrapper = mount(DayCard, {
      props: { day: mockDay, routineId: 'r1' },
    })

    // Act
    await wrapper.find('.btn-ghost').trigger('click')
    await getSelect(wrapper, 'Categoria muscular').setValue('pecho')
    await getSelect(wrapper, 'Ejercicio').setValue('Press banca')
    await getSelect(wrapper, 'Categoria muscular').setValue('espalda')

    // Assert
    const exerciseSelect = getSelect(wrapper, 'Ejercicio') as any
    expect(exerciseSelect.element.value).toBe('')
  })
})
