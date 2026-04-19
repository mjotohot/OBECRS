<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 backdrop-blur-xs bg-opacity-50" @click="handleClose"></div>
    
    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          <i :class="mode === 'edit' ? 'fas fa-edit' : 'fas fa-user-plus'" class="mr-2"></i>
          {{ mode === 'edit' ? 'Edit Student' : 'Add New Student' }}
        </h3>
        <button 
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit">
          <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ID Number <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.id_number"
            type="text"
            placeholder="e.g., 201-00001"
            :class="[
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
              formErrors.id_number  ? 'border-red-500' : 'border-gray-300'
            ]"
            required
          />
          <p v-if="formErrors.id_number" class="mt-1 text-xs text-red-500">
            {{ formErrors.id_number }}
          </p>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Student Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., John Doe"
            :class="[
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
              formErrors.name ? 'border-red-500' : 'border-gray-300'
            ]"
            required
          />
          <p v-if="formErrors.name" class="mt-1 text-xs text-red-500">
            {{ formErrors.name }}
          </p>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            :class="[
              'px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50',
              mode === 'edit' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'
            ]"
          >
            <i v-if="loading" class="fas fa-spinner fa-pulse mr-2"></i>
            {{ loading ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Student' : 'Add Student') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

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
  loading: false
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
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

// Watch for student prop changes (for edit mode)
watch(() => props.student, () => {
  if (props.isOpen && props.mode === 'edit' && props.student) {
    resetForm()
  }
}, { deep: true })

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