<script setup lang="ts">
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'

const router = useRouter()

const handleLogoutConfirm = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <h1>Faculty Dashboard</h1>
  <button @click="handleLogoutConfirm">Sign Out</button>
</template>
