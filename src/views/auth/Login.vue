<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layouts/AuthLayout.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { signInWithPassword } from '@/services/auth.service'
import {
  PhGraduationCap,
  PhEnvelope,
  PhLock,
  PhEye,
  PhEyeSlash,
  PhSignIn,
  PhCircleNotch,
  PhHeadset,
  PhUserPlus,
} from '@phosphor-icons/vue'

const showPassword = ref(false)
const email = ref('')
const password = ref('')
const isRedirecting = ref(false)
const router = useRouter()

const { isLoading, success, wrapAsync } = useAsyncState()

async function handleSubmit() {
  const result = await wrapAsync(
    async () => {
      if (!email.value) throw new Error('Email is required')
      if (!email.value.includes('@')) throw new Error('Valid email required')
      if (!password.value) throw new Error('Password is required')

      const { data, error } = await signInWithPassword(email.value, password.value)
      if (error) throw new Error(error)
      return data
    },
    { successMsg: 'Login successful! Redirecting...' },
  )

  if (success.value && result) {
    isRedirecting.value = true
    const role = result.role
    const routeMap = {
      Faculty: '/faculty/dashboard',
      Chairperson: '/chairperson/dashboard',
      Admin: '/admin/dashboard',
    }
    const redirectPath = routeMap[role as keyof typeof routeMap] || '/unauthorized'
    setTimeout(() => router.push(redirectPath), 1500)
  }
}
</script>

<template>
  <AuthLayout>
    <div class="w-full max-w-md relative z-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-13 h-13 rounded-xl bg-[#009900] mb-5">
          <PhGraduationCap :size="24" color="white" weight="duotone" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight mb-1">OBE Class Record System</h1>
        <p class="text-sm text-slate-100">Sign in to your account</p>
      </div>

      <!-- Card -->
      <div
        class="bg-white/15 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl ring-1 ring-inset ring-white/5"
      >
        <form @submit.prevent="handleSubmit" novalidate class="space-y-5">
          <!-- Email -->
          <div class="space-y-1.5">
            <label for="email" class="block text-sm font-medium text-white"> Email Address </label>
            <div class="relative">
              <PhEnvelope
                :size="16"
                weight="regular"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white pointer-events-none"
              />
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="student@university.edu"
                autocomplete="email"
                :disabled="isLoading"
                class="w-full h-10 bg-white/10 border border-white/10 rounded-lg pl-9 pr-3.5 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:border-[#f9dc07] focus:ring-2 focus:ring-[#f9dc07]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="password" class="block text-sm font-medium text-white"> Password </label>
              <RouterLink class="text-xs text-blue-300" to="/forgot-password"
                >Forgot password?</RouterLink
              >
            </div>
            <div class="relative">
              <PhLock
                :size="16"
                weight="regular"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white pointer-events-none"
              />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="isLoading"
                class="w-full h-10 bg-white/10 border border-white/10 rounded-lg pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:border-[#f9dc07] focus:ring-2 focus:ring-[#f9dc07]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                :disabled="isLoading"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white disabled:opacity-40 cursor-pointer"
              >
                <PhEye v-if="!showPassword" :size="16" weight="regular" />
                <PhEyeSlash v-else :size="16" weight="regular" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || isRedirecting"
            class="w-full h-10 rounded-lg bg-[#003300] text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            <span v-if="!isLoading" class="inline-flex items-center gap-2">
              <PhSignIn :size="16" weight="bold" />
              Sign In
            </span>
            <span v-else class="inline-flex items-center gap-2">
              <PhCircleNotch :size="16" weight="bold" class="animate-spin" />
              Signing in…
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 h-px bg-white" />
          <span class="text-xs text-white">Don't have an account?</span>
          <div class="flex-1 h-px bg-white" />
        </div>

        <!-- Register -->
        <RouterLink
          class="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-white/10 text-slate-200 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all"
          to="/register"
        >
          <PhUserPlus :size="16" weight="bold" />Create Account</RouterLink
        >

        <!-- Footer -->
        <p class="mt-6 text-center text-xs text-slate-300 leading-relaxed">
          By signing in, you agree to our
          <RouterLink
            to="/terms"
            class="text-blue-300 hover:text-blue-300 hover:underline transition-colors"
            >Terms of Service</RouterLink
          >
          and
          <RouterLink
            to="/privacy"
            class="text-blue-300 hover:text-blue-300 hover:underline transition-colors"
            >Privacy Policy</RouterLink
          >
        </p>
      </div>

      <!-- Support -->
      <p
        class="mt-4 text-center text-xs text-white inline-flex items-center justify-center gap-1 w-full"
      >
        <PhHeadset :size="14" weight="regular" />
        Need help?
        <RouterLink to="/support" class="text-blue-300 font-medium">Contact Support</RouterLink>
      </p>
    </div>
  </AuthLayout>
</template>
