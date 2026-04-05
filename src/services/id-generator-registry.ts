import type { IdGenerator } from './id-generator'
import { cryptoIdGenerator } from './id-generator'

let override: IdGenerator | null = null

export function getIdGenerator(): IdGenerator {
  return override ?? cryptoIdGenerator
}

export function setIdGeneratorOverride(gen: IdGenerator): void {
  override = gen
}

export function resetIdGeneratorOverride(): void {
  override = null
}
