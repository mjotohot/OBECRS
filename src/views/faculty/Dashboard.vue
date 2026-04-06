<script setup lang="ts">
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'

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
  <AdminLayout>
    <div>
      <h2 class="text-3xl font-bold text-gray-900">Faculty Dashboard</h2>
      <p class="mt-1 text-gray-500">
        Quick access to syllabus, student enrollment, and score entry
      </p>
    </div>
  </AdminLayout>
</template>
