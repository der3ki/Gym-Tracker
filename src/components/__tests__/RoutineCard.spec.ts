import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RoutineCard from '../RoutineCard.vue'
import type { Routine } from '@/types'

const mockRoutine: Routine = {
  id: 'r1',
  name: 'Powerbuilding',
  days: [
    {
      id: 'd1',
      name: 'Día 1',
      exercises: [
        { id: 'e1', name: 'Sentadilla', type: 'strength', repRange: { min: 1, max: 5 }, defaultSets: 4 },
        { id: 'e2', name: 'Curl', type: 'hypertrophy', repRange: { min: 8, max: 12 }, defaultSets: 3 },
      ],
    },
    {
      id: 'd2',
      name: 'Día 2',
      exercises: [],
    },
  ],
  createdAt: '2026-04-01',
  updatedAt: '2026-04-01',
}

describe('RoutineCard', () => {
  it('should display routine name, day count, and exercise count', () => {
    // Arrange
    const wrapper = mount(RoutineCard, {
      props: { routine: mockRoutine },
    })

    // Act
    const text = wrapper.text()

    // Assert
    expect(text).toContain('Powerbuilding')
    expect(text).toContain('2 dias')
    expect(text).toContain('2 ejercicios')
  })

  it('should emit select when card is clicked', async () => {
    // Arrange
    const wrapper = mount(RoutineCard, {
      props: { routine: mockRoutine },
    })

    // Act
    await wrapper.find('.card').trigger('click')

    // Assert
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['r1'])
  })

  it('should emit delete when delete button is clicked without emitting select', async () => {
    // Arrange
    const wrapper = mount(RoutineCard, {
      props: { routine: mockRoutine },
    })

    // Act
    await wrapper.find('.btn-danger').trigger('click')

    // Assert
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual(['r1'])
    expect(wrapper.emitted('select')).toBeFalsy()
  })

  it('should show singular form for 1 day', () => {
    // Arrange
    const singleDayRoutine: Routine = {
      ...mockRoutine,
      days: [mockRoutine.days[0]],
    }

    // Act
    const wrapper = mount(RoutineCard, {
      props: { routine: singleDayRoutine },
    })

    // Assert
    expect(wrapper.text()).toContain('1 dia')
  })
})
