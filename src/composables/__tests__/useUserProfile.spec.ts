import { describe, it, expect, beforeEach } from 'vitest'
import { useUserProfile } from '../useUserProfile'
import { LocalStorageAdapter } from '@/services/storage'
import type { UserProfile } from '@/types'

describe('useUserProfile', () => {
  let storage: LocalStorageAdapter<UserProfile>

  beforeEach(() => {
    storage = new LocalStorageAdapter<UserProfile>('test-user-profile')
  })

  describe('createProfile', () => {
    it('should create a profile with name and null optional fields', async () => {
      // Arrange
      const { createProfile, profile } = useUserProfile(storage)

      // Act
      const created = await createProfile('Carlos')

      // Assert
      expect(created.name).toBe('Carlos')
      expect(created.bodyWeight).toBeNull()
      expect(created.height).toBeNull()
      expect(created.trainingStartDate).toBeNull()
      expect(profile.value).toEqual(created)
    })

    it('should persist profile to storage', async () => {
      // Arrange
      const { createProfile } = useUserProfile(storage)

      // Act
      await createProfile('Carlos')

      // Assert
      const { profile: loaded, init } = useUserProfile(storage)
      await init()
      expect(loaded.value).not.toBeNull()
      expect(loaded.value!.name).toBe('Carlos')
    })
  })

  describe('updateProfile', () => {
    it('should update individual fields', async () => {
      // Arrange
      const { createProfile, updateProfile, profile } = useUserProfile(storage)
      await createProfile('Carlos')

      // Act
      await updateProfile({ bodyWeight: 85, height: 178 })

      // Assert
      expect(profile.value!.bodyWeight).toBe(85)
      expect(profile.value!.height).toBe(178)
      expect(profile.value!.name).toBe('Carlos')
    })

    it('should update training start date', async () => {
      // Arrange
      const { createProfile, updateProfile, profile } = useUserProfile(storage)
      await createProfile('Carlos')

      // Act
      await updateProfile({ trainingStartDate: '2025-01-15' })

      // Assert
      expect(profile.value!.trainingStartDate).toBe('2025-01-15')
    })

    it('should not update if no profile exists', async () => {
      // Arrange
      const { updateProfile, profile } = useUserProfile(storage)

      // Act
      await updateProfile({ name: 'Carlos' })

      // Assert
      expect(profile.value).toBeNull()
    })

    it('should update the updatedAt timestamp', async () => {
      // Arrange
      const { createProfile, updateProfile, profile } = useUserProfile(storage)
      await createProfile('Carlos')
      const originalUpdatedAt = profile.value!.updatedAt
      await new Promise((r) => setTimeout(r, 5))

      // Act
      await updateProfile({ bodyWeight: 90 })

      // Assert
      expect(profile.value!.updatedAt).not.toBe(originalUpdatedAt)
    })
  })

  describe('deleteProfile', () => {
    it('should remove profile from storage', async () => {
      // Arrange
      const { createProfile, deleteProfile, profile } = useUserProfile(storage)
      await createProfile('Carlos')

      // Act
      await deleteProfile()

      // Assert
      expect(profile.value).toBeNull()
      const { profile: reloaded, init } = useUserProfile(storage)
      await init()
      expect(reloaded.value).toBeNull()
    })
  })

  describe('hasProfile', () => {
    it('should return false when no profile exists', () => {
      // Arrange
      const { hasProfile } = useUserProfile(storage)

      // Act & Assert
      expect(hasProfile.value).toBe(false)
    })

    it('should return true after creating a profile', async () => {
      // Arrange
      const { createProfile, hasProfile } = useUserProfile(storage)

      // Act
      await createProfile('Carlos')

      // Assert
      expect(hasProfile.value).toBe(true)
    })
  })

  describe('daysSinceStart', () => {
    it('should return null when no training start date', async () => {
      // Arrange
      const { createProfile, daysSinceStart } = useUserProfile(storage)
      await createProfile('Carlos')

      // Act & Assert
      expect(daysSinceStart.value).toBeNull()
    })

    it('should return null when no profile exists', () => {
      // Arrange
      const { daysSinceStart } = useUserProfile(storage)

      // Act & Assert
      expect(daysSinceStart.value).toBeNull()
    })

    it('should calculate days since training start', async () => {
      // Arrange
      const { createProfile, updateProfile, daysSinceStart } = useUserProfile(storage)
      await createProfile('Carlos')
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const dateStr = threeDaysAgo.toISOString().split('T')[0]

      // Act
      await updateProfile({ trainingStartDate: dateStr })

      // Assert
      expect(daysSinceStart.value).toBeGreaterThanOrEqual(3)
      expect(daysSinceStart.value).toBeLessThanOrEqual(4)
    })
  })
})
