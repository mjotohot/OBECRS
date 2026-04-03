<script setup lang="ts">
import { ref } from 'vue'
import AuthLayout from '@/components/layouts/AuthLayout.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { forgotPassword } from '@/services/auth.service'
import {
  PhKey,
  PhCheckCircle,
  PhWarningCircle,
  PhEnvelope,
  PhPaperPlaneTilt,
  PhCircleNotch,
  PhArrowLeft,
  PhSignIn,
  PhHeadset,
  PhInfo,
  PhListChecks,
} from '@phosphor-icons/vue'

const email = ref('')
const { isLoading, success, wrapAsync } = useAsyncState()

const nextSteps = [
  'Check your email for the reset link',
  'Click the link to create a new password',
  "You'll be able to sign in with your new password",
]

function resetForm() {
  success.value = false
  email.value = ''
}

async function handleSubmit() {
  await wrapAsync(
    async () => {
      if (!email.value) throw new Error('Email is required')
      if (!email.value.includes('@')) throw new Error('Valid email required')

      const { error } = await forgotPassword(email.value)
      if (error) throw new Error(error)
    },
    { successMsg: 'Reset link sent! Check your email.' },
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
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="inline-flex items-center justify-center mb-5">
            <PhCheckCircle :size="40" weight="fill" class="text-emerald-400" />
          </div>
          <h1 class="text-3xl font-bold text-slate-100 tracking-tight mb-2">Check Your Email</h1>
          <p class="text-sm text-slate-300">
            We've sent a password reset link to<br />
            <span class="text-white font-bold">{{ email }}</span>
          </p>
        </div>
        <!-- Next steps -->
        <div class="bg-white/30 border border-white/8 rounded-xl p-4 space-y-3">
          <p class="text-sm font-medium text-white flex items-center gap-2">
            <PhListChecks :size="16" weight="bold" />
            Next steps
          </p>
          <ul class="space-y-2">
            <li
              v-for="(step, i) in nextSteps"
              :key="i"
              class="flex items-start gap-2.5 text-sm text-slate-100"
            >
              <span
                class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#009900] text-slate-100 text-[10px] font-bold shrink-0 mt-0.5"
                >{{ i + 1 }}</span
              >
              {{ step }}
            </li>
          </ul>
        </div>

        <!-- Resend note -->
        <p class="text-sm text-slate-200">
          Didn't receive the email? Check your spam folder or
          <button
            type="button"
            class="text-slate-100 font-medium transition-colors underline-offset-2 hover:underline cursor-pointer"
            @click="resetForm"
          >
            try again with a different email
          </button>
        </p>

        <!-- Back to login -->
        <RouterLink
          to="/"
          class="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-[#003300] text-white text-sm font-semibold shadow-lg"
        >
          <PhSignIn :size="16" weight="bold" />
          Back to Sign In
        </RouterLink>
      </div>

      <!-- Support -->
      <p
        class="mt-4 text-center text-xs text-slate-100 inline-flex items-center justify-center gap-1 w-full"
      >
        <PhHeadset :size="14" />
        Still having trouble?
        <RouterLink
          to="/support"
          class="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Contact Support
        </RouterLink>
      </p>
    </div>

    <!-- Forgot Password Form -->
    <div v-else class="w-full max-w-md relative z-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-13 h-13 rounded-xl bg-[#009900] mb-5">
          <PhKey :size="24" color="white" weight="duotone" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight mb-1">Reset Password</h1>
        <p class="text-sm text-slate-100">
          Enter your email and we'll send you a link to reset your password
        </p>
      </div>

      <!-- Card -->
      <div
        class="bg-white/15 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl ring-1 ring-inset ring-white/5"
      >
        <form @submit.prevent="handleSubmit" novalidate class="space-y-5">
          <!-- Email -->
          <div class="space-y-1.5">
            <label for="email" class="block text-sm font-medium text-white">
              University Email Address
            </label>
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
            <p class="text-xs text-slate-200 flex items-center gap-1.5">
              <PhInfo :size="12" weight="regular" />
              We'll send a reset link to this email address
            </p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-10 rounded-lg cursor-pointer bg-[#003300] text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            <span v-if="!isLoading" class="inline-flex items-center gap-2">
              <PhPaperPlaneTilt :size="16" weight="bold" />
              Send Reset Link
            </span>
            <span v-else class="inline-flex items-center gap-2">
              <PhCircleNotch :size="16" weight="bold" class="animate-spin" />
              Sending…
            </span>
          </button>

          <!-- Divider -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-white" />
            <span class="text-xs text-white">or</span>
            <div class="flex-1 h-px bg-white" />
          </div>

          <!-- Back to login -->
          <RouterLink
            to="/"
            class="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-white/10 text-slate-200 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all"
          >
            <PhArrowLeft :size="16" weight="regular" />
            Back to Sign In
          </RouterLink>
        </form>

        <!-- Footer -->
        <p class="mt-6 text-center text-xs text-slate-300">
          Don't have an account?
          <RouterLink
            to="/register"
            class="text-blue-300 cursor-pointer font-medium transition-colors"
          >
            Create one
          </RouterLink>
        </p>
      </div>

      <!-- Support -->
      <p
        class="mt-4 text-center text-xs text-slate-300 inline-flex items-center justify-center gap-1 w-full"
      >
        <PhHeadset :size="14" />
        Need immediate help?
        <RouterLink to="/support" class="text-blue-300 font-medium transition-colors">
          Contact Support
        </RouterLink>
      </p>
    </div>
  </AuthLayout>
</template>
