<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/services/supabase.service'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
})
const submitting = ref(false)
const error = ref<string | null>(null)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      form.value = { first_name: '', last_name: '', email: '', password: '' }
      error.value = null
    }
  },
)

const handleSubmit = async () => {
  if (
    !form.value.email ||
    !form.value.password ||
    !form.value.first_name ||
    !form.value.last_name
  ) {
    error.value = 'All fields are required'
    return
  }

  submitting.value = true
  error.value = null

  try {
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form.value),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Request failed')
    }

    emit('success')
  } catch (err: any) {
    error.value = err.message || 'Failed to create faculty account'
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  if (submitting.value) return
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
      >
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>
        <div
          class="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Create Faculty Account</h2>
            <button @click="handleClose" class="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <!-- form fields (unchanged) -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                v-model="form.first_name"
                type="text"
                class="block w-full rounded-lg border border-slate-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Juan"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                v-model="form.last_name"
                type="text"
                class="block w-full rounded-lg border border-slate-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Cruz"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="block w-full rounded-lg border border-slate-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="faculty@example.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              v-model="form.password"
              type="password"
              class="block w-full rounded-lg border border-slate-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 p-2 rounded">{{ error }}</div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              @click="handleClose"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              @click="handleSubmit"
              :disabled="submitting"
              class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
            >
              <span
                v-if="submitting"
                class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
              ></span>
              {{ submitting ? 'Creating...' : 'Create Account' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
