import type { ExerciseType } from './exercise'

export type OverloadAction = 'increase_weight' | 'maintain' | 'insufficient_data'

export interface OverloadRecommendation {
  exerciseId: string
  action: OverloadAction
  currentWeight: number
  suggestedWeight: number | null
  reason: string
}

export const WEIGHT_INCREMENT: Record<ExerciseType, number> = {
  strength: 2.5,
  hypertrophy: 1,
  endurance: 0.5,
}

export const MIN_CONSECUTIVE_WEEKS = 2
export const GOOD_RIR_THRESHOLD = 2
