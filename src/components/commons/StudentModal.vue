<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <component
            :is="mode === 'edit' ? PhPencilSimple : PhUserPlus"
            :size="22"
            weight="bold"
            class="text-indigo-600"
          />
          {{ mode === 'edit' ? 'Edit Student' : 'Add New Student' }}
        </h3>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
        >
          <PhX :size="20" weight="bold" />
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-5">
        <!-- ID Number -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            ID Number <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.id_number"
            type="text"
            placeholder="e.g., 201-00001"
            :class="[
              'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400',
              formErrors.id_number
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300',
            ]"
            required
          />
          <p
            v-if="formErrors.id_number"
            class="mt-1.5 text-xs text-red-500 flex items-center gap-1"
          >
            <PhWarningCircle :size="14" weight="bold" />
            {{ formErrors.id_number }}
          </p>
        </div>

        <!-- Student Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Student Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., John Doe"
            :class="[
              'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400',
              formErrors.name
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300',
            ]"
            required
          />
          <p v-if="formErrors.name" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <PhWarningCircle :size="14" weight="bold" />
            {{ formErrors.name }}
          </p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="handleClose"
            class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            :class="[
              'px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2',
              mode === 'edit'
                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
            ]"
          >
            <PhSpinner v-if="loading" :size="18" class="animate-spin" />
            <template v-if="loading">
              {{ mode === 'edit' ? 'Updating...' : 'Adding...' }}
            </template>
            <template v-else>
              {{ mode === 'edit' ? 'Update Student' : 'Add Student' }}
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { PhUserPlus, PhPencilSimple, PhX, PhSpinner, PhWarningCircle } from '@phosphor-icons/vue'

interface Props {
  isOpen: boolean
  mode?: 'add' | 'edit'
  student?: any
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'add',
  student: null,
  loading: false,
})

const emit = defineEmits<Emits>()

// Form data
const formData = reactive({
  name: '',
  id_number: '',
})

// Form errors
const formErrors = reactive({
  name: '',
  id_number: '',
})

// Reset form
const resetForm = () => {
  if (props.mode === 'edit' && props.student) {
    formData.name = props.student.name || ''
  } else {
    formData.name = ''
  }

  formErrors.name = ''
}

// Watch for modal open
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  },
)

// Watch for student prop changes (for edit mode)
watch(
  () => props.student,
  () => {
    if (props.isOpen && props.mode === 'edit' && props.student) {
      resetForm()
    }
  },
  { deep: true },
)

// Validate form
const validateForm = (): boolean => {
  let isValid = true

  formErrors.name = ''

  if (!formData.name.trim()) {
    formErrors.name = 'Student name is required'
    isValid = false
  } else if (formData.name.length < 2) {
    formErrors.name = 'Student name must be at least 2 characters'
    isValid = false
  }

  return isValid
}

// Handle form submission
const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', { ...formData })
  }
}

// Handle modal close
const handleClose = () => {
  resetForm()
  emit('close')
}
</script>
