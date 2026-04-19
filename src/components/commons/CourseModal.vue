<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 backdrop-blur-xs bg-opacity-50" @click="handleClose"></div>
    
    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          <i :class="mode === 'edit' ? 'fas fa-edit' : 'fas fa-plus-circle'" class="mr-2"></i>
          {{ mode === 'edit' ? 'Edit Course' : 'Add New Course' }}
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
            Course Code <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.course_code"
            type="text"
            placeholder="e.g., CS 101"
            :disabled="mode === 'edit' && disableCodeEdit"
            :class="[
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
              formErrors.course_code ? 'border-red-500' : 'border-gray-300',
              (mode === 'edit' && disableCodeEdit) ? 'bg-gray-100 cursor-not-allowed' : ''
            ]"
            required
          />
          <p v-if="formErrors.course_code" class="mt-1 text-xs text-red-500">
            {{ formErrors.course_code }}
          </p>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Course Title <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.course_title"
            type="text"
            placeholder="e.g., Introduction to Computer Science"
            :class="[
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
              formErrors.course_title ? 'border-red-500' : 'border-gray-300'
            ]"
            required
          />
          <p v-if="formErrors.course_title" class="mt-1 text-xs text-red-500">
            {{ formErrors.course_title }}
          </p>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Section <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.section"
            type="text"
            placeholder="e.g., A, B, or 1, 2, 3"
            :class="[
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
              formErrors.section ? 'border-red-500' : 'border-gray-300'
            ]"
            required
          />
          <p v-if="formErrors.section" class="mt-1 text-xs text-red-500">
            {{ formErrors.section }}
          </p>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Academic Year <span class="text-red-500">*</span>
          </label>
          <select
            v-model="selectedAcademicYearId"
            @change="updateAcademicYearId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :disabled="academicYearsLoading"
            required
          >
            <option :value="null">Select Academic Year</option>
            <option 
              v-for="year in academicYears" 
              :key="year.id" 
              :value="year.id"
            >
              {{ year.year }} - {{ year.semester }} {{ year.isActive ? '(Active)' : '' }}
            </option>
          </select>
          <p v-if="formErrors.academic_year_id" class="mt-1 text-xs text-red-500">
            {{ formErrors.academic_year_id }}
          </p>
          <p v-if="academicYearsLoading" class="mt-1 text-xs text-gray-500">
            Loading academic years...
          </p>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            v-model="formData.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
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
            {{ loading ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Course' : 'Add Course') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useAcademicYearStore } from '@/stores/academicYear'
import { storeToRefs } from 'pinia'

interface Props {
  isOpen: boolean
  mode?: 'add' | 'edit'
  course?: any
  loading?: boolean
  disableCodeEdit?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'add',
  course: null,
  loading: false,
  disableCodeEdit: true
})

const emit = defineEmits<Emits>()

// Academic Year Store
const academicYearStore = useAcademicYearStore()
const { allYears: academicYears, isLoading: academicYearsLoading } = storeToRefs(academicYearStore)

// Separate ref for selected academic year ID to ensure reactivity
const selectedAcademicYearId = ref<number | null>(null)

// Form data
const formData = reactive({
  course_code: '',
  course_title: '',
  section: '',
  academic_year_id: null as number | null,
  status: 'Not Started'
})

// Form errors
const formErrors = reactive({
  course_code: '',
  course_title: '',
  section: '',
  academic_year_id: ''
})

// Update function to sync selected value with form data
const updateAcademicYearId = () => {
  formData.academic_year_id = selectedAcademicYearId.value
  console.log('Selected academic year ID:', selectedAcademicYearId.value) // Debug log
  console.log('Form data academic_year_id:', formData.academic_year_id) // Debug log
}

// Load academic years when modal opens
const loadAcademicYears = async () => {
  if (academicYears.value.length === 0) {
    await academicYearStore.fetchAllYears()
  }
}

// Reset form
const resetForm = () => {
  if (props.mode === 'edit' && props.course) {
    formData.course_code = props.course.course_code || ''
    formData.course_title = props.course.course_title || ''
    formData.section = props.course.section || ''
    formData.academic_year_id = props.course.academic_year_id || null
    formData.status = props.course.status || 'Not Started'
    
    // Sync the selected value with form data
    selectedAcademicYearId.value = formData.academic_year_id
  } else {
    formData.course_code = ''
    formData.course_title = ''
    formData.section = ''
    formData.academic_year_id = null
    formData.status = 'Not Started'
    
    // Reset selected value
    selectedAcademicYearId.value = null
  }
  
  formErrors.course_code = ''
  formErrors.course_title = ''
  formErrors.section = ''
  formErrors.academic_year_id = ''
}

// Watch for modal open
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await loadAcademicYears()
    resetForm()
  }
})

// Watch for course prop changes (for edit mode)
watch(() => props.course, () => {
  if (props.isOpen && props.mode === 'edit' && props.course) {
    resetForm()
  }
}, { deep: true })

// Validate form
const validateForm = (): boolean => {
  let isValid = true
  
  formErrors.course_code = ''
  formErrors.course_title = ''
  formErrors.section = ''
  formErrors.academic_year_id = ''
  
  if (!formData.course_code.trim()) {
    formErrors.course_code = 'Course code is required'
    isValid = false
  } else if (formData.course_code.length < 2) {
    formErrors.course_code = 'Course code must be at least 2 characters'
    isValid = false
  }
  
  if (!formData.course_title.trim()) {
    formErrors.course_title = 'Course title is required'
    isValid = false
  } else if (formData.course_title.length < 3) {
    formErrors.course_title = 'Course title must be at least 3 characters'
    isValid = false
  }
  
  if (!formData.section.trim()) {
    formErrors.section = 'Section is required'
    isValid = false
  }
  
  if (!formData.academic_year_id) {
    formErrors.academic_year_id = 'Please select an academic year'
    isValid = false
  }
  
  return isValid
}

// Handle form submission
const handleSubmit = () => {
  if (validateForm()) {
    // Make sure academic_year_id is up to date
    formData.academic_year_id = selectedAcademicYearId.value
    
    console.log('Submitting form data:', { ...formData }) // Debug log
    
    // Submit the form data with academic_year_id
    emit('submit', { ...formData })
  }
}

// Handle modal close
const handleClose = () => {
  resetForm()
  emit('close')
}

// Initial load if needed
onMounted(() => {
  loadAcademicYears()
})
</script>