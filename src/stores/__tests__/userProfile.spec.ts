import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserProfileStore } from '../userProfile'
import { LocalStorageAdapter } from '@/services/storage'
import { setStorageOverride, resetStorageRegistry } from '@/services/storage-registry'
import type { UserProfile } from '@/types'

describe('userProfileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const storage = new LocalStorageAdapter<UserProfile>('test-user-profile')
    setStorageOverride('user-profile', storage)
  })

  beforeEach(() => {
    return () => {
      resetStorageRegistry()
    }
  })

  describe('createProfile', () => {
    it('should create a profile with name and null optional fields', async () => {
      // Arrange
      const store = useUserProfileStore()

      // Act
      const created = await store.createProfile('Carlos')

      // Assert
      expect(created.name).toBe('Carlos')
      expect(created.bodyWeight).toBeNull()
      expect(created.height).toBeNull()
      expect(created.trainingStartDate).toBeNull()
      expect(store.profile).toEqual(created)
    })

    it('should persist profile to storage', async () => {
      // Arrange
      const store = useUserProfileStore()

      // Act
      await store.createProfile('Carlos')

      // Assert — reload via ensureLoaded on a fresh store instance
      store.$reset()
      await store.ensureLoaded()
      expect(store.profile).not.toBeNull()
      expect(store.profile!.name).toBe('Carlos')
    })
  })

  describe('updateProfile', () => {
    it('should update individual fields', async () => {
      // Arrange
      const store = useUserProfileStore()
      await store.createProfile('Carlos')

      // Act
      await store.updateProfile({ bodyWeight: 85, height: 178 })

      // Assert
      expect(store.profile!.bodyWeight).toBe(85)
      expect(store.profile!.height).toBe(178)
      expect(store.profile!.name).toBe('Carlos')
    })

    it('should update training start date', async () => {
      // Arrange
      const store = useUserProfileStore()
      await store.createProfile('Carlos')

      // Act
      await store.updateProfile({ trainingStartDate: '2025-01-15' })

      // Assert
      expect(store.profile!.trainingStartDate).toBe('2025-01-15')
    })

    it('should not update if no profile exists', async () => {
      // Arrange
      const store = useUserProfileStore()

      // Act
      await store.updateProfile({ name: 'Carlos' })

      // Assert
      expect(store.profile).toBeNull()
    })

    it('should update the updatedAt timestamp', async () => {
      // Arrange
      const store = useUserProfileStore()
      await store.createProfile('Carlos')
      const originalUpdatedAt = store.profile!.updatedAt
      await new Promise((r) => setTimeout(r, 5))

      // Act
      await store.updateProfile({ bodyWeight: 90 })

      // Assert
      expect(store.profile!.updatedAt).not.toBe(originalUpdatedAt)
    })
  })

  describe('deleteProfile', () => {
    it('should remove profile from storage', async () => {
      // Arrange
      const store = useUserProfileStore()
      await store.createProfile('Carlos')

      // Act
      await store.deleteProfile()

      // Assert
      expect(store.profile).toBeNull()
      store.$reset()
      await store.ensureLoaded()
      expect(store.profile).toBeNull()
    })
  })

  describe('hasProfile', () => {
    it('should return false when no profile exists', () => {
      // Arrange
      const store = useUserProfileStore()

      // Act & Assert
      expect(store.hasProfile).toBe(false)
    })

    it('should return true after creating a profile', async () => {
      // Arrange
      const store = useUserProfileStore()

      // Act
      await store.createProfile('Carlos')

      // Assert
      expect(store.hasProfile).toBe(true)
    })
  })

  describe('daysSinceStart', () => {
    it('should return null when no training start date', async () => {
      // Arrange
      const store = useUserProfileStore()
      await store.createProfile('Carlos')

      // Act & Assert
      expect(store.daysSinceStart).toBeNull()
    })

    it('should return null when no profile exists', () => {
      // Arrange
      const store = useUserProfileStore()

      // Act & Assert
      expect(store.daysSinceStart).toBeNull()
    })

    it('should calculate days since training start', async () => {
      // Arrange
      const store = useUserProfileStore()
      await store.createProfile('Carlos')
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const dateStr = threeDaysAgo.toISOString().split('T')[0]

      // Act
      await store.updateProfile({ trainingStartDate: dateStr })

      // Assert
      expect(store.daysSinceStart).toBeGreaterThanOrEqual(3)
      expect(store.daysSinceStart).toBeLessThanOrEqual(4)
    })
  })
})
