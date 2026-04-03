<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layouts/AuthLayout.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { usePasswordValidation } from '@/composables/usePasswordValidation'
import { signUpWithEmail } from '@/services/auth.service'
import {
  PhArrowLeft,
  PhGraduationCap,
  PhUser,
  PhEnvelope,
  PhLock,
  PhLockKey,
  PhEye,
  PhEyeSlash,
  PhCheck,
  PhUserPlus,
  PhSignIn,
  PhCircleNotch,
  PhHeadset,
} from '@phosphor-icons/vue'

const { isLoading, success, wrapAsync } = useAsyncState()
const {
  password,
  confirmPassword,
  passwordsMatch,
  isStrongEnough,
  strengthBarColor,
  strengthTextColor,
  strengthLabel,
} = usePasswordValidation()

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  agreedToTerms: false,
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const router = useRouter()
const isRedirecting = ref(false)

async function handleSubmit() {
  await wrapAsync(
    async () => {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !password.value ||
        !confirmPassword.value
      ) {
        throw new Error('Please fill in all fields')
      }
      if (!passwordsMatch.value) {
        throw new Error('Passwords do not match')
      }
      if (!isStrongEnough.value) {
        throw new Error('Password must be at least 8 characters')
      }
      if (!formData.agreedToTerms) {
        throw new Error('Please agree to the terms and conditions')
      }

      await signUpWithEmail(
        formData.email,
        password.value,
        formData.firstName,
        formData.lastName,
        'Faculty',
      )

      formData.firstName = ''
      formData.lastName = ''
      formData.email = ''
      password.value = ''
      confirmPassword.value = ''
      formData.agreedToTerms = false
    },
    { successMsg: 'Account successfully created!' },
  )

  if (success.value) {
    isRedirecting.value = true
    setTimeout(() => router.push('/'), 1500)
  }
}
</script>

<template>
  <AuthLayout class="p-10">
    <!-- Register Form -->
    <div class="w-full max-w-md relative z-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-13 h-13 rounded-xl bg-[#009900] mb-5">
          <PhGraduationCap :size="24" color="white" weight="duotone" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight mb-1">Create Account</h1>
        <p class="text-sm text-slate-100">Sign up to use the system</p>
      </div>

      <!-- Card -->
      <div
        class="bg-white/15 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl ring-1 ring-inset ring-white/5"
      >
        <form @submit.prevent="handleSubmit" novalidate class="space-y-5">
          <!-- First & Last Name -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label for="firstName" class="block text-sm font-medium text-slate-200"
                >First Name</label
              >
              <div class="relative">
                <PhUser
                  :size="16"
                  weight="regular"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                />
                <input
                  id="firstName"
                  v-model="formData.firstName"
                  type="text"
                  placeholder="John"
                  autocomplete="given-name"
                  :disabled="isLoading"
                  class="w-full h-10 bg-white/10 border border-white/10 rounded-lg pl-9 pr-3.5 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:border-[#f9dc07] focus:ring-2 focus:ring-[#f9dc07]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div class="space-y-1.5">
              <label for="lastName" class="block text-sm font-medium text-slate-200"
                >Last Name</label
              >
              <div class="relative">
                <PhUser
                  :size="16"
                  weight="regular"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                />
                <input
                  id="lastName"
                  v-model="formData.lastName"
                  type="text"
                  placeholder="Doe"
                  autocomplete="family-name"
                  :disabled="isLoading"
                  class="w-full h-10 bg-white/10 border border-white/10 rounded-lg pl-9 pr-3.5 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:border-[#f9dc07] focus:ring-2 focus:ring-[#f9dc07]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label for="email" class="block text-sm font-medium text-slate-200"
              >University Email</label
            >
            <div class="relative">
              <PhEnvelope
                :size="16"
                weight="regular"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white pointer-events-none"
              />
              <input
                id="email"
                v-model="formData.email"
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
            <label for="password" class="block text-sm font-medium text-slate-200">Password</label>
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
                placeholder="Create a strong password"
                autocomplete="new-password"
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

            <!-- Password strength -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
            >
              <div v-if="password" class="space-y-1.5 pt-0.5">
                <div class="flex gap-1">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="flex-1 h-1 rounded-full transition-colors"
                    :class="
                      i <= (strengthLabel === 'Strong' ? 3 : strengthLabel === 'Fair' ? 2 : 1)
                        ? strengthBarColor
                        : 'bg-white/10'
                    "
                  />
                </div>
                <p class="text-xs font-medium" :class="strengthTextColor">
                  Password strength: <span class="capitalize">{{ strengthLabel || 'none' }}</span>
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
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white pointer-events-none"
              />
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your password"
                autocomplete="new-password"
                :disabled="isLoading"
                class="w-full h-10 bg-white/10 border border-white/10 rounded-lg pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-300 outline-none transition focus:border-[#f9dc07] focus:ring-2 focus:ring-[#f9dc07]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                :disabled="isLoading"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white disabled:opacity-40 cursor-pointer"
              >
                <PhEye v-if="!showConfirmPassword" :size="16" weight="regular" />
                <PhEyeSlash v-else :size="16" weight="regular" />
              </button>
            </div>
          </div>

          <!-- Terms Checkbox -->
          <div class="flex items-start gap-3">
            <button
              type="button"
              role="checkbox"
              :aria-checked="formData.agreedToTerms"
              :disabled="isLoading"
              @click="formData.agreedToTerms = !formData.agreedToTerms"
              class="mt-0.5 w-4 h-4 rounded shrink-0 border transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              :class="
                formData.agreedToTerms
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white/5 border-white/20 hover:border-white/40'
              "
            >
              <PhCheck v-if="formData.agreedToTerms" :size="10" weight="bold" color="white" />
            </button>
            <label
              class="text-xs text-slate-300 leading-relaxed cursor-pointer select-none"
              @click="formData.agreedToTerms = !formData.agreedToTerms"
            >
              I agree to the
              <RouterLink
                to="/terms"
                class="text-blue-300 hover:text-blue-300 hover:underline transition-colors"
                @click.stop
                >Terms of Service</RouterLink
              >
              and
              <RouterLink
                to="/privacy"
                class="text-blue-300 hover:text-blue-300 hover:underline transition-colors"
                @click.stop
                >Privacy Policy</RouterLink
              >
            </label>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || isRedirecting"
            class="w-full h-10 rounded-lg bg-[#003300] text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            <span v-if="!isLoading && !isRedirecting" class="inline-flex items-center gap-2">
              <PhUserPlus :size="16" weight="bold" />
              Create Account
            </span>
            <span v-else class="inline-flex items-center gap-2">
              <PhCircleNotch :size="16" weight="bold" class="animate-spin" />
              Creating Account…
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 h-px bg-white" />
          <span class="text-xs text-white">Don't have an account?</span>
          <div class="flex-1 h-px bg-white" />
        </div>

        <!-- Login Link -->
        <RouterLink
          class="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-white/10 text-slate-200 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all"
          to="/"
        >
          <PhArrowLeft :size="16" weight="regular" />
          Back to Login
        </RouterLink>
      </div>

      <!-- Support -->
      <p
        class="mt-4 text-center text-xs text-white inline-flex items-center justify-center gap-1 w-full"
      >
        <PhHeadset :size="14" weight="regular" />
        Have questions?
        <RouterLink to="/support" class="text-blue-300 font-medium">Contact Support</RouterLink>
      </p>
    </div>
  </AuthLayout>
</template>
