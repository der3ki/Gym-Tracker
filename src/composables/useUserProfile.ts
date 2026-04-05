import { ref, computed } from 'vue'
import type { UserProfile } from '@/types'
import type { StoragePort } from '@/services/storage'
import { createStorage } from '@/services/storage-provider'
import type { IdGenerator } from '@/services/id-generator'
import { cryptoIdGenerator } from '@/services/id-generator'

const PROFILE_ID = 'user-profile'

export function useUserProfile(
  storage: StoragePort<UserProfile> = createStorage<UserProfile>('user-profile', '/api/user-profile'),
  idGenerator: IdGenerator = cryptoIdGenerator,
) {
  const profile = ref<UserProfile | null>(null)

  const hasProfile = computed(() => profile.value !== null)

  const daysSinceStart = computed(() => {
    if (!profile.value?.trainingStartDate) return null
    const start = new Date(profile.value.trainingStartDate)
    const now = new Date()
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  })

  async function init(): Promise<void> {
    profile.value = (await storage.getById(PROFILE_ID)) ?? null
  }

  async function createProfile(name: string): Promise<UserProfile> {
    const now = new Date().toISOString()
    const newProfile: UserProfile = {
      id: PROFILE_ID,
      name,
      bodyWeight: null,
      height: null,
      trainingStartDate: null,
      createdAt: now,
      updatedAt: now,
    }
    await storage.save(newProfile)
    profile.value = newProfile
    return newProfile
  }

  async function updateProfile(updates: Partial<Pick<UserProfile, 'name' | 'bodyWeight' | 'height' | 'trainingStartDate'>>): Promise<void> {
    if (!profile.value) return
    const updated: UserProfile = {
      ...profile.value,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await storage.save(updated)
    profile.value = updated
  }

  async function deleteProfile(): Promise<void> {
    await storage.remove(PROFILE_ID)
    profile.value = null
  }

  return {
    profile,
    hasProfile,
    daysSinceStart,
    init,
    createProfile,
    updateProfile,
    deleteProfile,
  }
}
