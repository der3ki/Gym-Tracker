import { LocalStorageAdapter, ApiStorageAdapter } from './storage'
import type { StoragePort } from './storage'
import { getToken } from './auth'

type StorageMode = 'local' | 'api'

const STORAGE_MODE_KEY = 'gym-tracker-storage-mode'

export function getStorageMode(): StorageMode {
  return (localStorage.getItem(STORAGE_MODE_KEY) as StorageMode) ?? 'local'
}

export function hasChosenMode(): boolean {
  return localStorage.getItem(STORAGE_MODE_KEY) !== null
}

export function setStorageMode(mode: StorageMode): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode)
}

export function createStorage<T extends { id: string }>(key: string, apiEndpoint: string): StoragePort<T> {
  if (getStorageMode() === 'api') {
    return new ApiStorageAdapter<T>(apiEndpoint, getToken)
  }
  return new LocalStorageAdapter<T>(key)
}
