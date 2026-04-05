export interface SetLog {
  reps: number
  weight: number
  rir: number | null
}

export interface ExerciseLog {
  exerciseId: string
  sets: SetLog[]
}

export interface WorkoutLog {
  id: string
  routineId: string
  dayId: string
  date: string
  exercises: ExerciseLog[]
}
