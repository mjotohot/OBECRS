<!-- components/commons/GradeModal.vue -->
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 backdrop-blur-sm bg-black/40 bg-opacity-50"
      @click="handleClose"
    ></div>

    <!-- Modal Content -->
    <div
      class="relative bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 p-6 max-h-[90vh] flex flex-col"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          <i class="fas fa-edit mr-2"></i>
          Input Grades
        </h3>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 text-2xl font-bold">
          ×
        </button>
      </div>

      <div class="mb-4">
        <p class="text-sm text-gray-600" v-if="student">
          <span class="font-semibold">Student:</span> {{ student.id_number }} - {{ student.name }}
        </p>
      </div>

      <div v-if="error" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div
        v-if="validationErrors[-1]"
        class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
      >
        <p class="text-sm text-yellow-700">{{ validationErrors[-1] }}</p>
      </div>

      <div class="overflow-x-auto max-h-[60vh]">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >
                Course Outcome
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >
                Max Score
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >
                Weight (%)
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >
                Score
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
                <td class="px-4 py-3 text-sm text-gray-600 text-center align-top">
                  {{ co.co_score }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 text-center align-top">
                  {{ (co.co_weight * 100).toFixed(2) }}%
                </td>
                <td class="px-4 py-3 text-center align-top">
                  <input
                    type="number"
                    :value="formScores[co.id]"
                    @input="(e) => handleScoreChange(co.id, (e.target as HTMLInputElement).value)"
                    :class="[
                      'w-28 px-2 py-1 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      validationErrors[co.id] ? 'border-red-500' : 'border-gray-300',
                    ]"
                    step="0.01"
                    :disabled="saving"
                    placeholder="Enter score"
                  />
                  <p v-if="validationErrors[co.id]" class="text-xs text-red-500 mt-1">
                    {{ validationErrors[co.id] }}
                  </p>
                </td>
              </tr>
            </template>
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
          :disabled="saving"
          :class="[
            'px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50',
            'bg-indigo-600 hover:bg-indigo-700',
          ]"
        >
          <i v-if="saving" class="fas fa-spinner fa-pulse mr-2"></i>
          {{ saving ? 'Saving...' : 'Save Grades' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface CourseOutcome {
  id: number
  co_code: string
  co_description: string
  co_score: number
  co_weight: number
  course_id: number
  created_at: string
}

interface Props {
  isOpen: boolean
  student: {
    id: number
    id_number: string
    name: string
  } | null
  courseOutcomes: CourseOutcome[]
  existingScores: Record<number, string | number>
  saving: boolean
  error?: string | null
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', scores: Record<number, string | number>): void
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

// Reset form
const resetForm = () => {
  if (props.existingScores && Object.keys(props.existingScores).length > 0) {
    formScores.value = { ...props.existingScores }
  } else {
    formScores.value = {}
    props.courseOutcomes.forEach((co) => {
      formScores.value[co.id] = ''
    })
  }
  validationErrors.value = {}
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

// Watch for existingScores changes
watch(
  () => props.existingScores,
  () => {
    if (props.isOpen) {
      resetForm()
    }
  },
  { deep: true },
)

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
    validationErrors.value[co.id] = 'Score cannot be negative'
    return false
  }

  if (numValue > co.co_score) {
    validationErrors.value[co.id] = `Maximum score is ${co.co_score}`
    return false
  }

  validationErrors.value[co.id] = ''
  return true
}

const handleScoreChange = (coId: number, value: string) => {
  const co = props.courseOutcomes.find((c) => c.id === coId)
  if (co) {
    validateScore(co, value)
  }
  formScores.value[coId] = value
}

const hasAnyScore = computed(() => {
  return Object.values(formScores.value).some(
    (score) => score !== '' && score !== null && score !== undefined,
  )
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

  if (!hasAnyScore.value) {
    validationErrors.value[-1] = 'Please enter at least one grade'
    return
  }

  emit('submit', formScores.value)
}

const handleClose = () => {
  if (!props.saving) {
    resetForm()
    emit('close')
  }
}
</script>
