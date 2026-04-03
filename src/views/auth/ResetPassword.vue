<script setup lang="ts">
import { ref, computed } from 'vue'
import AuthLayout from '@/components/layouts/AuthLayout.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { usePasswordValidation } from '@/composables/usePasswordValidation'
import { resetPassword } from '@/services/auth.service'
import {
  PhLockKeyOpen,
  PhLockKey,
  PhLock,
  PhLockSimple,
  PhEye,
  PhEyeSlash,
  PhCheckCircle,
  PhXCircle,
  PhCircle,
  PhShieldCheck,
  PhSignIn,
  PhCircleNotch,
  PhHeadset,
} from '@phosphor-icons/vue'

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const { isLoading, success, wrapAsync } = useAsyncState()
const {
  password,
  confirmPassword,
  passwordsMatch,
  isStrongEnough,
  strengthBarColor,
  strengthTextColor,
  strengthLabel,
  requirements,
} = usePasswordValidation()

const strengthBarWidth = computed(() => {
  if (strengthLabel.value === 'Strong') return '100%'
  if (strengthLabel.value === 'Fair') return '66%'
  if (strengthLabel.value === 'Weak') return '33%'
  return '0%'
})

const successItems = [
  'Your new password is active',
  "You've been signed out of all devices",
  'Sign in again to continue',
]

async function handleSubmit() {
  await wrapAsync(
    async () => {
      if (!password.value || !confirmPassword.value) throw new Error('Fill all fields')
      if (!isStrongEnough.value) throw new Error('Password must be 8+ characters')
      if (!passwordsMatch.value) throw new Error('Passwords do not match')

      const { error } = await resetPassword(password.value)
      if (error) throw new Error(error)
    },
    { successMsg: 'Password reset successful! You can now sign in.' },
  )
}
</script>

<template>
  <AuthLayout>
    <!-- Success State -->
    <div v-if="success" class="w-full max-w-md relative z-10">
      <div
        class="bg-white/15 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl ring-1 ring-inset ring-white/5 space-y-5"
      >
        <div class="mb-8 text-center">
          <div
            class="inline-flex items-center justify-center w-13 h-13 rounded-xl bg-emerald-500/15 border border-emerald-500/20 mb-5"
          >
            <PhCheckCircle :size="26" weight="fill" class="text-emerald-400" />
          </div>
          <h1 class="text-3xl font-bold text-slate-100 tracking-tight mb-2">Password Reset!</h1>
          <p class="text-sm text-slate-400">Your password has been updated successfully.</p>
        </div>
        <div class="bg-white/30 border border-white/8 rounded-xl p-4 space-y-2.5">
          <p class="text-sm font-medium text-slate-200">
            You can now sign in with your new password
          </p>
          <ul class="space-y-2">
            <li
              v-for="item in successItems"
              :key="item"
              class="flex items-center gap-2 text-sm text-slate-400"
            >
              <PhCheckCircle :size="14" weight="fill" class="text-emerald-400 shrink-0" />
              {{ item }}
            </li>
          </ul>
        </div>
        <RouterLink
          to="/"
          class="flex items-center bg-[#003300] justify-center gap-2 w-full h-10 rounded-lg text-white text-sm font-semibold"
        >
          <PhSignIn :size="16" weight="bold" />
          Sign In
        </RouterLink>
      </div>
    </div>

    <!-- Reset Password Form -->
    <div v-else class="w-full max-w-md relative z-10">
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-13 h-13 rounded-xl bg-[#009900] mb-5">
          <PhLockKeyOpen :size="24" color="white" weight="duotone" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight mb-1">Create New Password</h1>
        <p class="text-sm text-slate-100">Choose a strong password to secure your account</p>
      </div>
      <div
        class="bg-white/15 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl ring-1 ring-inset ring-white/5"
      >
        <form @submit.prevent="handleSubmit" novalidate class="space-y-5">
          <!-- New Password -->
          <div class="space-y-1.5">
            <label for="password" class="block text-sm font-medium text-slate-200"
              >New Password</label
            >
            <div class="relative">
              <PhLock
                :size="16"
                weight="regular"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none"
              />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create a strong password"
                autocomplete="new-password"
                :disabled="isLoading"
                class="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                :disabled="isLoading"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PhEye v-if="!showPassword" :size="16" weight="regular" />
                <PhEyeSlash v-else :size="16" weight="regular" />
              </button>
            </div>

            <!-- Strength bar -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
            >
              <div v-if="password" class="space-y-1.5 pt-0.5">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="strengthBarColor"
                      :style="{ width: strengthBarWidth }"
                    />
                  </div>
                  <span class="text-xs font-medium w-10 text-right" :class="strengthTextColor">
                    {{ strengthLabel }}
                  </span>
                </div>
                <p class="text-xs text-slate-500">
                  Use at least 8 characters with uppercase letters and numbers
                </p>
              </div>
            </Transition>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-1.5">
            <label for="confirmPassword" class="block text-sm font-medium text-slate-200"
              >Confirm Password</label
            >
            <div class="relative">
              <PhLockKey
                :size="16"
                weight="regular"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none"
              />
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Re-enter your password"
                autocomplete="new-password"
                :disabled="isLoading"
                class="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                :disabled="isLoading"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PhEye v-if="!showConfirmPassword" :size="16" weight="regular" />
                <PhEyeSlash v-else :size="16" weight="regular" />
              </button>
            </div>

            <!-- Match feedback -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
            >
              <p
                v-if="confirmPassword && password !== confirmPassword"
                class="text-xs text-rose-400 flex items-center gap-1"
              >
                <PhXCircle :size="12" weight="fill" /> Passwords do not match
              </p>
              <p
                v-else-if="confirmPassword && password === confirmPassword"
                class="text-xs text-emerald-400 flex items-center gap-1"
              >
                <PhCheckCircle :size="12" weight="fill" /> Passwords match
              </p>
            </Transition>
          </div>

          <!-- Password Requirements -->
          <div class="bg-white/30 border border-white/8 rounded-xl p-4 space-y-2">
            <p class="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <PhShieldCheck :size="13" weight="bold" class="text-blue-400" />
              Password Requirements
            </p>
            <ul class="space-y-1.5">
              <li
                v-for="req in requirements"
                :key="req.label"
                class="flex items-center gap-2 text-xs transition-colors duration-200"
                :class="req.met ? 'text-emerald-400' : 'text-slate-500'"
              >
                <PhCheckCircle v-if="req.met" :size="13" weight="fill" class="shrink-0" />
                <PhCircle v-else :size="13" weight="regular" class="shrink-0" />
                {{ req.label }}
              </li>
            </ul>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || !password || !confirmPassword || password !== confirmPassword"
            class="w-full h-10 rounded-lg cursor-pointer bg-[#003300] text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            <span v-if="!isLoading" class="inline-flex items-center gap-2">
              <PhLockSimple :size="16" weight="bold" />
              Reset Password
            </span>
            <span v-else class="inline-flex items-center gap-2">
              <PhCircleNotch :size="16" weight="bold" class="animate-spin" />
              Resetting Password…
            </span>
          </button>
        </form>

        <!-- Footer -->
        <p class="mt-6 text-center text-xs text-slate-200">
          Remember your password?
          <RouterLink
            to="/"
            class="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Sign In
          </RouterLink>
        </p>
      </div>

      <!-- Support -->
      <p
        class="mt-4 text-center text-xs text-slate-200 inline-flex items-center justify-center gap-1 w-full"
      >
        <PhHeadset :size="14" />
        Having issues?
        <RouterLink
          to="/support"
          class="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Contact Support
        </RouterLink>
      </p>
    </div>
  </AuthLayout>
</template>
