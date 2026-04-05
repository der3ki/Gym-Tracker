import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  TrainingWeek,
  WeekDayPlan,
  CompletedExercise,
  Routine,
} from '@/types'
import { getStorage } from '@/services/storage-registry'
import { getIdGenerator } from '@/services/id-generator-registry'
import { createWeekGenerator } from '@/composables/useWeekGenerator'

export const useTrainingWeekStore = defineStore('trainingWeek', () => {
  const storage = getStorage<TrainingWeek>('training-weeks', '/api/training-weeks')
  const weeks = ref<TrainingWeek[]>([])
  const loaded = ref(false)
  const weekGenerator = createWeekGenerator()

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return
    weeks.value = await storage.getAll()
    loaded.value = true
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
      id: getIdGenerator().generate(),
      routineId: routine.id,
      weekNumber: 1,
      status: 'in_progress',
      days,
      createdAt: new Date().toISOString(),
    }

    weeks.value.push(week)
    await storage.save(week)
    return week
  }

  async function syncWeekWithRoutine(weekId: string, routine: Routine): Promise<void> {
    const week = weeks.value.find((w) => w.id === weekId)
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
      await storage.save({ ...week })
    }
  }

  async function saveDayWorkout(
    weekId: string,
    dayId: string,
    exercises: CompletedExercise[],
  ): Promise<void> {
    const week = weeks.value.find((w) => w.id === weekId)
    if (!week || week.status === 'completed') return

    const day = week.days.find((d) => d.dayId === dayId)
    if (!day) return

    day.completedExercises = exercises
    day.status = 'completed'

    await storage.save({ ...week })
  }

  function isWeekComplete(weekId: string): boolean {
    const week = weeks.value.find((w) => w.id === weekId)
    if (!week) return false
    return week.days.every((d) => d.status === 'completed')
  }

  async function completeWeekAndGenerateNext(
    weekId: string,
    routine: Routine,
  ): Promise<TrainingWeek | undefined> {
    const currentWeek = weeks.value.find((w) => w.id === weekId)
    if (!currentWeek) return undefined

    currentWeek.status = 'completed'
    await storage.save({ ...currentWeek })

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
      id: getIdGenerator().generate(),
      routineId: routine.id,
      weekNumber: currentWeek.weekNumber + 1,
      status: 'in_progress',
      days: newDays,
      createdAt: new Date().toISOString(),
    }

    weeks.value.push(nextWeek)
    await storage.save(nextWeek)
    return nextWeek
  }

  function $reset(): void {
    weeks.value = []
    loaded.value = false
  }

  return {
    weeks,
    loaded,
    ensureLoaded,
    getWeeksByRoutine,
    getActiveWeek,
    getWeekById,
    startFirstWeek,
    syncWeekWithRoutine,
    saveDayWorkout,
    isWeekComplete,
    completeWeekAndGenerateNext,
    $reset,
  }
})
