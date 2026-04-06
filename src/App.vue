<!-- App.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/useAuthStore'
import Toast from '@/components/commons/Toast.vue'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.fetchUser()
})
</script>

<template>
  <div v-if="!authStore.isReady" class="flex h-screen items-center justify-center bg-gray-50">
    <div class="flex flex-col items-center">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-[#ff9900] border-t-transparent"
      ></div>
      <p class="mt-4 text-sm font-medium text-gray-700">Loading your workspace...</p>
    </div>
  </div>
  <router-view v-else />
  <Toast />
</template>
