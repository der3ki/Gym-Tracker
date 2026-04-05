import type { SetLog } from './workout-log'

export type WeekDayStatus = 'pending' | 'completed'
export type WeekStatus = 'in_progress' | 'completed'

export interface ExerciseTarget {
  exerciseId: string
  targetWeight: number
  targetReps: number
  recommendation: string
}

export interface WeekDayPlan {
  dayId: string
  status: WeekDayStatus
  exerciseTargets: ExerciseTarget[]
  completedExercises: CompletedExercise[]
}

export interface CompletedExercise {
  exerciseId: string
  sets: SetLog[]
}

export interface TrainingWeek {
  id: string
  routineId: string
  weekNumber: number
  status: WeekStatus
  days: WeekDayPlan[]
  createdAt: string
}
