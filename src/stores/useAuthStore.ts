import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentUser, signOut as storeSignOut } from '@/services/auth.service'
import type { User } from '@/types/userTypes'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isReady = ref(false)

  const role = computed(() => user.value?.role ?? null)

  async function fetchUser() {
    if (user.value !== null) return user.value
    if (isReady.value) return user.value

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await getCurrentUser()
      if (err) {
        error.value = err
        user.value = null
      } else {
        user.value = data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      user.value = null
    } finally {
      loading.value = false
      isReady.value = true
    }

    return user.value
  }

  async function StoreLogout() {
    await storeSignOut()
    user.value = null
    error.value = null
    isReady.value = false
  }

  return { user, role, loading, error, isReady, fetchUser, StoreLogout }
})
