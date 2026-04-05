export type ExerciseType = 'strength' | 'hypertrophy' | 'endurance'

export interface RepRange {
  min: number
  max: number
}

export interface RepRangeBounds {
  floor: number
  ceiling: number
}

export interface Exercise {
  id: string
  name: string
  type: ExerciseType
  category?: string
  repRange: RepRange
  defaultSets: number
}

export const STRENGTH_REP_RANGE: RepRange = { min: 1, max: 6 }
export const HYPERTROPHY_REP_RANGE: RepRange = { min: 6, max: 12 }
export const ENDURANCE_REP_RANGE: RepRange = { min: 12, max: 20 }

export const REP_RANGE_BOUNDS: Record<ExerciseType, RepRangeBounds> = {
  strength: { floor: 1, ceiling: 6 },
  hypertrophy: { floor: 6, ceiling: 12 },
  endurance: { floor: 12, ceiling: 20 },
}

export const DEFAULT_SETS: Record<ExerciseType, number> = {
  strength: 4,
  hypertrophy: 3,
  endurance: 3,
}
