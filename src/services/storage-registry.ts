import type { StoragePort } from './storage'
import { createStorage } from './storage-provider'

const overrides = new Map<string, StoragePort<any>>()
const instances = new Map<string, StoragePort<any>>()

export function getStorage<T extends { id: string }>(key: string, apiEndpoint: string): StoragePort<T> {
  const override = overrides.get(key)
  if (override) return override as StoragePort<T>

  if (!instances.has(key)) {
    instances.set(key, createStorage<T>(key, apiEndpoint))
  }
  return instances.get(key) as StoragePort<T>
}

export function setStorageOverride<T extends { id: string }>(key: string, storage: StoragePort<T>): void {
  overrides.set(key, storage)
}

export function resetStorageRegistry(): void {
  overrides.clear()
  instances.clear()
}
