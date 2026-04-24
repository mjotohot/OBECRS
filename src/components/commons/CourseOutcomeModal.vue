<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 backdrop-blur-xs bg-black bg-opacity-50" @click="handleClose"></div>
    
    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 p-6 max-h-[90vh] flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          <i class="fas fa-edit mr-2"></i>
          Edit Course Outcome Max Scores - {{ course?.course_code }}: {{ course?.course_title }}
        </h3>
        <button 
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600" v-if="course">
          <span class="font-semibold">Section:</span> {{ course.section }} | 
          <span class="font-semibold">Status:</span> 
          <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', getStatusBadgeClass(course.status)]">
            <i :class="[getStatusIcon(course.status), 'mr-1 text-xs']"></i>
            {{ course.status }}
          </span>
        </p>
      </div>
      
      <div v-if="error" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div class="overflow-x-auto max-h-[60vh]">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Course Outcome
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Current Max Score
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Weight (%)
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Edit Max Score
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="coCode in coKeys" :key="coCode">
              <tr class="bg-indigo-50">
                <td colspan="5" class="px-4 py-2 text-sm font-semibold text-indigo-700">
                  {{ coCode }}
                </td>
              </tr>
              <tr v-for="co in groupedOutcomes[coCode]" :key="co.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900 align-top">
                  {{ co.co_code }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 align-top">
                  {{ co.co_description }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 text-center align-top font-semibold">
                  {{ co.co_score || 'Not set' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 text-center align-top">
                  {{ co.co_weight }}%
                </td>
                <td class="px-4 py-3 text-center align-top">
                  <input
                    type="number"
                    :value="formScores[co.id]"
                    @input="(e) => handleScoreChange(co.id, (e.target as HTMLInputElement).value)"
                    :class="[
                      'w-28 px-2 py-1 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      validationErrors[co.id] ? 'border-red-500' : 'border-gray-300'
                    ]"
                    step="1"
                    :disabled="saving"
                    placeholder="Enter max score"
                  />
                  <p v-if="validationErrors[co.id]" class="text-xs text-red-500 mt-1">
                    {{ validationErrors[co.id] }}
                  </p>
                </td>
              </tr>
            </template>
            
            <tr v-if="courseOutcomes.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                <i class="fas fa-info-circle text-4xl mb-3 block"></i>
                No course outcomes found for this course.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          @click="handleClose"
          :disabled="saving"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="saving || courseOutcomes.length === 0"
          :class="[
            'px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50',
            'bg-indigo-600 hover:bg-indigo-700'
          ]"
        >
          <i v-if="saving" class="fas fa-spinner fa-pulse mr-2"></i>
          {{ saving ? 'Saving...' : 'Update Max Scores' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Course {
  id: number
  course_code: string
  course_title: string
  section: string
  status: string
}

interface CourseOutcome {
  id: number
  co_code: string
  co_description: string
  co_score: number | null  // This is the MAX SCORE, can be null
  co_weight: number
  course_id: number
  created_at: string
}

interface Props {
  isOpen: boolean
  course: Course | null
  courseOutcomes: CourseOutcome[]
  saving: boolean
  error?: string | null
}

interface Emits {
  (e: 'close'): void
  (e: 'save', updatedOutcomes: CourseOutcome[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formScores = ref<Record<number, string | number>>({})
const validationErrors = ref<Record<number, string>>({})

// Group outcomes by co_code
const groupedOutcomes = computed(() => {
  const groups: Record<string, CourseOutcome[]> = {}
  for (const co of props.courseOutcomes) {
    if (!groups[co.co_code]) groups[co.co_code] = []
    groups[co.co_code]?.push(co)
  }
  return groups
})

const coKeys = computed(() => Object.keys(groupedOutcomes.value))

// Reset form with current scores
const resetForm = () => {
  formScores.value = {}
  props.courseOutcomes.forEach(co => {
    formScores.value[co.id] = co.co_score || ''
  })
  validationErrors.value = {}
}

// Watch for modal open
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

// Watch for courseOutcomes changes
watch(() => props.courseOutcomes, () => {
  if (props.isOpen) {
    resetForm()
  }
}, { deep: true })

const validateScore = (co: CourseOutcome, value: string | number | undefined): boolean => {
  if (value === '' || value === null || value === undefined) {
    validationErrors.value[co.id] = ''
    return true
  }

  const numValue = parseFloat(String(value))
  if (isNaN(numValue)) {
    validationErrors.value[co.id] = 'Must be a valid number'
    return false
  }

  if (numValue < 0) {
    validationErrors.value[co.id] = 'Max score cannot be negative'
    return false
  }

  validationErrors.value[co.id] = ''
  return true
}

const handleScoreChange = (coId: number, value: string) => {
  const co = props.courseOutcomes.find(c => c.id === coId)
  if (co) {
    validateScore(co, value)
  }
  formScores.value[coId] = value
}

const hasChanges = computed(() => {
  for (const co of props.courseOutcomes) {
    const currentScore = formScores.value[co.id]
    const originalScore = co.co_score
    if (String(currentScore) !== String(originalScore)) {
      return true
    }
  }
  return false
})

const handleSubmit = () => {
  let isValid = true
  for (const co of props.courseOutcomes) {
    const score = formScores.value[co.id]
    if (!validateScore(co, score)) {
      isValid = false
    }
  }
  
  if (!isValid) return
  
  if (!hasChanges.value) {
    // No changes, just close
    handleClose()
    return
  }
  
  // Create updated outcomes array with new max scores
  const updatedOutcomes = props.courseOutcomes.map(co => ({
    ...co,
    co_score: formScores.value[co.id] ? parseFloat(String(formScores.value[co.id])) : null
  }))
  
  emit('save', updatedOutcomes)
}

const handleClose = () => {
  if (!props.saving) {
    resetForm()
    emit('close')
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'Not Started':
      return 'bg-gray-100 text-gray-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'fas fa-spinner fa-pulse'
    case 'Not Started':
      return 'fas fa-clock'
    case 'Completed':
      return 'fas fa-check-circle'
    default:
      return 'fas fa-circle'
  }
}
</script>