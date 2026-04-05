import { describe, it, expect, beforeEach } from 'vitest'
import { useStats } from '../useStats'
import { LocalStorageAdapter } from '@/services/storage'
import type { TrainingWeek, Routine } from '@/types'

const mockRoutine: Routine = {
  id: 'r1',
  name: 'Powerbuilding',
  days: [
    {
      id: 'd1',
      name: 'Upper',
      exercises: [
        { id: 'bench', name: 'Press Banca', type: 'strength', repRange: { min: 1, max: 6 }, defaultSets: 4 },
        { id: 'curl', name: 'Curl', type: 'hypertrophy', repRange: { min: 6, max: 12 }, defaultSets: 3 },
      ],
    },
    {
      id: 'd2',
      name: 'Lower',
      exercises: [
        { id: 'squat', name: 'Sentadilla', type: 'strength', repRange: { min: 1, max: 6 }, defaultSets: 4 },
      ],
    },
  ],
  createdAt: '2026-04-01',
  updatedAt: '2026-04-01',
}

function createWeek(overrides: Partial<TrainingWeek> = {}): TrainingWeek {
  return {
    id: 'w1',
    routineId: 'r1',
    weekNumber: 1,
    status: 'completed',
    days: [],
    createdAt: '2026-04-01',
    ...overrides,
  }
}

describe('useStats', () => {
  let weekStorage: LocalStorageAdapter<TrainingWeek>
  let routineStorage: LocalStorageAdapter<Routine>

  beforeEach(() => {
    weekStorage = new LocalStorageAdapter<TrainingWeek>('test-stats-weeks')
    routineStorage = new LocalStorageAdapter<Routine>('test-stats-routines')
    routineStorage.save(mockRoutine)
  })

  describe('getPersonalRecords', () => {
    it('should return empty array when no weeks exist', async () => {
      // Arrange
      const { getPersonalRecords } = useStats(weekStorage, routineStorage)

      // Act
      const prs = await getPersonalRecords()

      // Assert
      expect(prs).toEqual([])
    })

    it('should return PR for each exercise with highest weight', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [
          {
            dayId: 'd1',
            status: 'completed',
            exerciseTargets: [],
            completedExercises: [
              { exerciseId: 'bench', sets: [
                { reps: 5, weight: 80, rir: 2 },
                { reps: 4, weight: 85, rir: 1 },
              ]},
            ],
          },
        ],
      }))
      const { getPersonalRecords } = useStats(weekStorage, routineStorage)

      // Act
      const prs = await getPersonalRecords()

      // Assert
      const benchPR = prs.find((p) => p.exerciseId === 'bench')!
      expect(benchPR.weight).toBe(85)
      expect(benchPR.reps).toBe(4)
      expect(benchPR.exerciseName).toBe('Press Banca')
    })

    it('should track PRs across multiple weeks', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [{
          dayId: 'd2',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
          ],
        }],
      }))
      weekStorage.save(createWeek({
        id: 'w2',
        weekNumber: 2,
        days: [{
          dayId: 'd2',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'squat', sets: [{ reps: 5, weight: 110, rir: 2 }] },
          ],
        }],
      }))
      const { getPersonalRecords } = useStats(weekStorage, routineStorage)

      // Act
      const prs = await getPersonalRecords()

      // Assert
      const squatPR = prs.find((p) => p.exerciseId === 'squat')!
      expect(squatPR.weight).toBe(110)
      expect(squatPR.weekNumber).toBe(2)
    })

    it('should return PRs sorted by exercise name', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [
          {
            dayId: 'd1',
            status: 'completed',
            exerciseTargets: [],
            completedExercises: [
              { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
              { exerciseId: 'curl', sets: [{ reps: 10, weight: 15, rir: 3 }] },
            ],
          },
          {
            dayId: 'd2',
            status: 'completed',
            exerciseTargets: [],
            completedExercises: [
              { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
            ],
          },
        ],
      }))
      const { getPersonalRecords } = useStats(weekStorage, routineStorage)

      // Act
      const prs = await getPersonalRecords()

      // Assert
      expect(prs).toHaveLength(3)
      expect(prs[0].exerciseName).toBe('Curl')
      expect(prs[1].exerciseName).toBe('Press Banca')
      expect(prs[2].exerciseName).toBe('Sentadilla')
    })

    it('should include routine name in PR', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [{
          dayId: 'd1',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
          ],
        }],
      }))
      const { getPersonalRecords } = useStats(weekStorage, routineStorage)

      // Act
      const prs = await getPersonalRecords()

      // Assert
      expect(prs[0].routineName).toBe('Powerbuilding')
    })

    it('should skip weeks with no matching routine', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        routineId: 'unknown',
        weekNumber: 1,
        days: [{
          dayId: 'd1',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
          ],
        }],
      }))
      const { getPersonalRecords } = useStats(weekStorage, routineStorage)

      // Act
      const prs = await getPersonalRecords()

      // Assert
      expect(prs).toEqual([])
    })

    it('should use exerciseId as name when exercise not found in routine', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [{
          dayId: 'd1',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'deleted-exercise', sets: [{ reps: 5, weight: 50, rir: 2 }] },
          ],
        }],
      }))
      const { getPersonalRecords } = useStats(weekStorage, routineStorage)

      // Act
      const prs = await getPersonalRecords()

      // Assert
      expect(prs[0].exerciseName).toBe('deleted-exercise')
    })
  })

  describe('getExerciseProgressions', () => {
    it('should return empty array when no weeks exist', async () => {
      // Arrange
      const { getExerciseProgressions } = useStats(weekStorage, routineStorage)

      // Act
      const progressions = await getExerciseProgressions('r1')

      // Assert
      expect(progressions).toEqual([])
    })

    it('should return progression with max weight and volume per week', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [{
          dayId: 'd1',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'bench', sets: [
              { reps: 5, weight: 80, rir: 2 },
              { reps: 5, weight: 85, rir: 1 },
              { reps: 4, weight: 80, rir: 2 },
            ]},
          ],
        }],
      }))
      const { getExerciseProgressions } = useStats(weekStorage, routineStorage)

      // Act
      const progressions = await getExerciseProgressions('r1')

      // Assert
      expect(progressions).toHaveLength(1)
      expect(progressions[0].exerciseName).toBe('Press Banca')
      expect(progressions[0].dataPoints).toHaveLength(1)
      expect(progressions[0].dataPoints[0].maxWeight).toBe(85)
      // volume = 80*5 + 85*5 + 80*4 = 400 + 425 + 320 = 1145
      expect(progressions[0].dataPoints[0].volume).toBe(1145)
    })

    it('should track progression across multiple weeks', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [{
          dayId: 'd2',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
          ],
        }],
      }))
      weekStorage.save(createWeek({
        id: 'w2',
        weekNumber: 2,
        days: [{
          dayId: 'd2',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'squat', sets: [{ reps: 5, weight: 105, rir: 2 }] },
          ],
        }],
      }))
      weekStorage.save(createWeek({
        id: 'w3',
        weekNumber: 3,
        days: [{
          dayId: 'd2',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'squat', sets: [{ reps: 6, weight: 105, rir: 1 }] },
          ],
        }],
      }))
      const { getExerciseProgressions } = useStats(weekStorage, routineStorage)

      // Act
      const progressions = await getExerciseProgressions('r1')

      // Assert
      const squat = progressions.find((p) => p.exerciseId === 'squat')!
      expect(squat.dataPoints).toHaveLength(3)
      expect(squat.dataPoints[0].weekNumber).toBe(1)
      expect(squat.dataPoints[0].maxWeight).toBe(100)
      expect(squat.dataPoints[1].weekNumber).toBe(2)
      expect(squat.dataPoints[1].maxWeight).toBe(105)
      expect(squat.dataPoints[2].weekNumber).toBe(3)
      expect(squat.dataPoints[2].maxWeight).toBe(105)
    })

    it('should return progressions sorted by exercise name', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        weekNumber: 1,
        days: [
          {
            dayId: 'd1',
            status: 'completed',
            exerciseTargets: [],
            completedExercises: [
              { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
              { exerciseId: 'curl', sets: [{ reps: 10, weight: 15, rir: 3 }] },
            ],
          },
          {
            dayId: 'd2',
            status: 'completed',
            exerciseTargets: [],
            completedExercises: [
              { exerciseId: 'squat', sets: [{ reps: 5, weight: 100, rir: 2 }] },
            ],
          },
        ],
      }))
      const { getExerciseProgressions } = useStats(weekStorage, routineStorage)

      // Act
      const progressions = await getExerciseProgressions('r1')

      // Assert
      expect(progressions).toHaveLength(3)
      expect(progressions[0].exerciseName).toBe('Curl')
      expect(progressions[1].exerciseName).toBe('Press Banca')
      expect(progressions[2].exerciseName).toBe('Sentadilla')
    })

    it('should only return data for the specified routine', async () => {
      // Arrange
      weekStorage.save(createWeek({
        id: 'w1',
        routineId: 'other-routine',
        weekNumber: 1,
        days: [{
          dayId: 'd1',
          status: 'completed',
          exerciseTargets: [],
          completedExercises: [
            { exerciseId: 'bench', sets: [{ reps: 5, weight: 80, rir: 2 }] },
          ],
        }],
      }))
      const { getExerciseProgressions } = useStats(weekStorage, routineStorage)

      // Act
      const progressions = await getExerciseProgressions('r1')

      // Assert
      expect(progressions).toEqual([])
    })
  })
})
