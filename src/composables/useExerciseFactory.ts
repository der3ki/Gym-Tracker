import type { Exercise, ExerciseType, RepRange } from '@/types'
import {
  STRENGTH_REP_RANGE,
  HYPERTROPHY_REP_RANGE,
  ENDURANCE_REP_RANGE,
  REP_RANGE_BOUNDS,
  DEFAULT_SETS,
} from '@/types'
import type { IdGenerator } from '@/services/id-generator'
import { cryptoIdGenerator } from '@/services/id-generator'

const DEFAULT_RANGES: Record<ExerciseType, RepRange> = {
  strength: STRENGTH_REP_RANGE,
  hypertrophy: HYPERTROPHY_REP_RANGE,
  endurance: ENDURANCE_REP_RANGE,
}

export interface ExerciseFactory {
  getDefaultRepRange(type: ExerciseType): RepRange
  clampRepRange(type: ExerciseType, range: RepRange): RepRange
  create(name: string, type: ExerciseType, customRepRange?: RepRange, sets?: number, category?: string): Exercise
}

export function createExerciseFactory(
  idGenerator: IdGenerator = cryptoIdGenerator,
): ExerciseFactory {
  function clampRepRange(type: ExerciseType, range: RepRange): RepRange {
    const bounds = REP_RANGE_BOUNDS[type]
    const min = Math.max(bounds.floor, Math.min(range.min, bounds.ceiling))
    const max = Math.max(min, Math.min(range.max, bounds.ceiling))
    return { min, max }
  }

  return {
    getDefaultRepRange(type: ExerciseType): RepRange {
      return { ...DEFAULT_RANGES[type] }
    },

    clampRepRange,

    create(name: string, type: ExerciseType, customRepRange?: RepRange, sets?: number, category?: string): Exercise {
      const repRange = customRepRange
        ? clampRepRange(type, customRepRange)
        : DEFAULT_RANGES[type]
      return {
        id: idGenerator.generate(),
        name,
        type,
        ...(category && { category }),
        repRange,
        defaultSets: sets ?? DEFAULT_SETS[type],
      }
    },
  }
}
