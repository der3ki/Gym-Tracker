import { ref } from 'vue'
import type {
  TrainingWeek,
  WeekDayPlan,
  CompletedExercise,
  Routine,
} from '@/types'
import type { StoragePort } from '@/services/storage'
import { createStorage } from '@/services/storage-provider'
import type { IdGenerator } from '@/services/id-generator'
import { cryptoIdGenerator } from '@/services/id-generator'
import { createWeekGenerator } from './useWeekGenerator'

export function useTrainingWeek(
  storage: StoragePort<TrainingWeek> = createStorage<TrainingWeek>('training-weeks', '/api/training-weeks'),
  idGenerator: IdGenerator = cryptoIdGenerator,
) {
  const weeks = ref<TrainingWeek[]>([])
  const weekGenerator = createWeekGenerator()

  async function init(): Promise<void> {
    weeks.value = await storage.getAll()
  }

  function getWeeksByRoutine(routineId: string): TrainingWeek[] {
    return weeks.value
      .filter((w) => w.routineId === routineId)
      .sort((a, b) => a.weekNumber - b.weekNumber)
  }

  function getActiveWeek(routineId: string): TrainingWeek | undefined {
    return weeks.value.find(
      (w) => w.routineId === routineId && w.status === 'in_progress',
    )
  }

  function getWeekById(weekId: string): TrainingWeek | undefined {
    return weeks.value.find((w) => w.id === weekId)
  }

  async function startFirstWeek(routine: Routine): Promise<TrainingWeek> {
    const days: WeekDayPlan[] = routine.days.map((day) => ({
      dayId: day.id,
      status: 'pending',
      exerciseTargets: day.exercises.map((ex) =>
        weekGenerator.generateFirstWeekTarget(ex),
      ),
      completedExercises: [],
    }))

    const week: TrainingWeek = {
      id: idGenerator.generate(),
      routineId: routine.id,
      weekNumber: 1,
      status: 'in_progress',
      days,
      createdAt: new Date().toISOString(),
    }

    await storage.save(week)
    weeks.value = await storage.getAll()
    return week
  }

  async function syncWeekWithRoutine(weekId: string, routine: Routine): Promise<void> {
    const week = await storage.getById(weekId)
    if (!week || week.status === 'completed') return

    let changed = false

    for (const routineDay of routine.days) {
      const existingDay = week.days.find((d) => d.dayId === routineDay.id)

      if (!existingDay) {
        week.days.push({
          dayId: routineDay.id,
          status: 'pending',
          exerciseTargets: routineDay.exercises.map((ex) =>
            weekGenerator.generateFirstWeekTarget(ex),
          ),
          completedExercises: [],
        })
        changed = true
      } else if (existingDay.status === 'pending') {
        const newExercises = routineDay.exercises.filter(
          (ex) => !existingDay.exerciseTargets.some((t) => t.exerciseId === ex.id),
        )
        if (newExercises.length > 0) {
          existingDay.exerciseTargets.push(
            ...newExercises.map((ex) => weekGenerator.generateFirstWeekTarget(ex)),
          )
          changed = true
        }
      }
    }

    if (changed) {
      await storage.save(week)
      weeks.value = await storage.getAll()
    }
  }

  async function saveDayWorkout(
    weekId: string,
    dayId: string,
    exercises: CompletedExercise[],
  ): Promise<void> {
    const week = await storage.getById(weekId)
    if (!week || week.status === 'completed') return

    const day = week.days.find((d) => d.dayId === dayId)
    if (!day) return

    day.completedExercises = exercises
    day.status = 'completed'

    await storage.save(week)
    weeks.value = await storage.getAll()
  }

  async function isWeekComplete(weekId: string): Promise<boolean> {
    const week = await storage.getById(weekId)
    if (!week) return false
    return week.days.every((d) => d.status === 'completed')
  }

  async function completeWeekAndGenerateNext(
    weekId: string,
    routine: Routine,
  ): Promise<TrainingWeek | undefined> {
    const currentWeek = await storage.getById(weekId)
    if (!currentWeek) return undefined

    currentWeek.status = 'completed'
    await storage.save(currentWeek)
    weeks.value = await storage.getAll()

    const routineWeeks = getWeeksByRoutine(routine.id)
    const completedWeeks = routineWeeks.filter((w) => w.status === 'completed')

    const newDays: WeekDayPlan[] = routine.days.map((day) => {
      const previousWeeksData: CompletedExercise[][] = completedWeeks
        .sort((a, b) => b.weekNumber - a.weekNumber)
        .map((w) => {
          const weekDay = w.days.find((d) => d.dayId === day.id)
          return weekDay?.completedExercises ?? []
        })

      const exerciseTargets = day.exercises.map((ex) =>
        weekGenerator.generateTargetsForExercise(ex, previousWeeksData),
      )

      return {
        dayId: day.id,
        status: 'pending' as const,
        exerciseTargets,
        completedExercises: [],
      }
    })

    const nextWeek: TrainingWeek = {
      id: idGenerator.generate(),
      routineId: routine.id,
      weekNumber: currentWeek.weekNumber + 1,
      status: 'in_progress',
      days: newDays,
      createdAt: new Date().toISOString(),
    }

    await storage.save(nextWeek)
    weeks.value = await storage.getAll()
    return nextWeek
  }

  return {
    weeks,
    init,
    getWeeksByRoutine,
    getActiveWeek,
    getWeekById,
    startFirstWeek,
    syncWeekWithRoutine,
    saveDayWorkout,
    isWeekComplete,
    completeWeekAndGenerateNext,
  }
}
