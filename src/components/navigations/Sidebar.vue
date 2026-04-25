<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppModal from '../commons/AppModal.vue'
import navImage from '@/assets/images/navbar.svg'
import avatarImage from '@/assets/images/avatar.jpg'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  PhList,
  PhX,
  PhSignOut,
  PhUsers,
  PhPen,
  PhPrinter,
  PhListChecks,
} from '@phosphor-icons/vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const auth = useAuthStore()

const route = useRoute()
const router = useRouter()
const showLogoutConfirm = ref(false)
const isLoggingOut = ref(false)

const navigationItems = computed(() => {
  const user_role = auth.role
  if (user_role === 'Admin') {
    return []
  }
  if (user_role === 'Chairperson') {
    return []
  }
  if (user_role === 'Faculty') {
    return [
      { name: 'My Courses', href: '/faculty/courses', icon: PhPen },
      { name: 'My Students', href: '/faculty/students', icon: PhUsers },
      { name: 'Reports', href: '/faculty/reports', icon: PhPrinter },
    ]
  }
})

function isActive(href: string) {
  return route.path.startsWith(href)
}

const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await auth.StoreLogout()
    router.push('/')
  } finally {
    isLoggingOut.value = false
    showLogoutConfirm.value = false
  }
}

const defaultAvatar = avatarImage
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-[#003300] text-white transition-all duration-300',
      isOpen ? 'w-64' : 'w-20',
    ]"
  >
    <div
      class="relative flex min-h-18 items-center justify-between border-b-2 border-[#ff9900] px-6"
      :style="{
        backgroundImage: `url(${navImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
    >
      <div class="absolute inset-0 z-0 bg-[#003300]/80 pointer-events-none"></div>

      <div v-if="isOpen" class="relative z-10 flex items-center">
        <span class="text-lg font-extrabold">OBE Records System</span>
      </div>

      <button
        @click="emit('toggle')"
        class="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15"
      >
        <PhX v-if="isOpen" class="h-5 w-5" />
        <PhList v-else class="h-5 w-5" />
      </button>
    </div>

    <nav class="z-10 flex flex-1 flex-col gap-2 overflow-hidden p-4">
      <router-link
        v-for="item in navigationItems"
        :key="item.href"
        :to="item.href"
        :class="[
          'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/70 transition',
          'hover:bg-white/10 hover:text-white',
          isActive(item.href) && 'bg-white/20 text-white',
        ]"
      >
        <component :is="item.icon" weight="bold" size="20" />
        <span v-if="isOpen" class="truncate">
          {{ item.name }}
        </span>
      </router-link>
    </nav>

    <div class="border-t-2 border-[#ff9900] p-4">
      <div :class="['flex items-center mb-4', isOpen ? 'space-x-3' : 'justify-center']">
        <img
          class="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center"
          :src="defaultAvatar"
          alt="user"
        />
        <div v-if="isOpen">
          <p class="text-sm font-bold">
            {{ (auth.user?.first_name || '') + ' ' + (auth.user?.last_name || '') || 'No name' }}
          </p>
          <p class="text-xs text-slate-200 mt-1">Role: {{ auth.user?.role || 'User' }}</p>
        </div>
      </div>
      <button
        @click="showLogoutConfirm = true"
        class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <PhSignOut class="h-5 w-5 shrink-0" />
        <span v-if="isOpen">Logout</span>
      </button>
    </div>
    <AppModal
      :isOpen="showLogoutConfirm"
      title="Logout Confirmation"
      message="Are you sure you want to logout? You will be redirected to the home page."
      confirmLabel="Logout"
      cancelLabel="Cancel"
      :loading="isLoggingOut"
      @confirm="handleLogout"
      @cancel="showLogoutConfirm = false"
    />
  </aside>
</template>
