import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile } from '@/types'
import { getStorage } from '@/services/storage-registry'

const PROFILE_ID = 'user-profile'

export const useUserProfileStore = defineStore('userProfile', () => {
  const storage = getStorage<UserProfile>('user-profile', '/api/user-profile')
  const profile = ref<UserProfile | null>(null)
  const loaded = ref(false)

  const hasProfile = computed(() => profile.value !== null)

  const daysSinceStart = computed(() => {
    if (!profile.value?.trainingStartDate) return null
    const start = new Date(profile.value.trainingStartDate)
    const now = new Date()
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  })

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return
    profile.value = (await storage.getById(PROFILE_ID)) ?? null
    loaded.value = true
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
    profile.value = newProfile
    await storage.save(newProfile)
    return newProfile
  }

  async function updateProfile(updates: Partial<Pick<UserProfile, 'name' | 'bodyWeight' | 'height' | 'trainingStartDate'>>): Promise<void> {
    if (!profile.value) return
    const updated: UserProfile = {
      ...profile.value,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    profile.value = updated
    await storage.save(updated)
  }

  async function deleteProfile(): Promise<void> {
    profile.value = null
    await storage.remove(PROFILE_ID)
  }

  function $reset(): void {
    profile.value = null
    loaded.value = false
  }

  return {
    profile,
    hasProfile,
    daysSinceStart,
    loaded,
    ensureLoaded,
    createProfile,
    updateProfile,
    deleteProfile,
    $reset,
  }
})
