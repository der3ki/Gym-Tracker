import type { Exercise } from './exercise'

export interface WorkoutDay {
  id: string
  name: string
  exercises: Exercise[]
}

export interface Routine {
  id: string
  name: string
  days: WorkoutDay[]
  createdAt: string
  updatedAt: string
}
