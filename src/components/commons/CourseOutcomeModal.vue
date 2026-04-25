<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal Content -->
    <div
      class="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PhPencil :size="22" weight="bold" class="text-indigo-600" />
          Edit Course Outcome Max Scores – {{ course?.course_code }}: {{ course?.course_title }}
        </h3>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
        >
          <PhX :size="20" weight="bold" />
        </button>
      </div>

      <!-- Course Info Bar -->
      <div class="px-6 py-3 bg-gray-50/80 border-b border-gray-100">
        <p class="text-sm text-gray-600 flex items-center flex-wrap gap-x-4 gap-y-1" v-if="course">
          <span> <span class="font-semibold">Section:</span> {{ course.section }} </span>
          <span class="flex items-center gap-1.5">
            <span class="font-semibold">Status:</span>
            <span
              :class="[
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusBadgeClass(course.status),
              ]"
            >
              <component
                :is="getStatusIconComponent(course.status)"
                :size="12"
                :class="course.status === 'In Progress' ? 'animate-spin' : ''"
                weight="bold"
              />
              {{ course.status }}
            </span>
          </span>
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2"
      >
        <PhWarningCircle :size="18" weight="bold" class="text-red-500 shrink-0" />
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <!-- Scrollable Table Area -->
      <div class="overflow-x-auto flex-1 px-6 py-4">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="sticky top-0 z-10">
            <tr class="bg-linear-to-b from-gray-50 to-gray-100/50">
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24"
              >
                Outcome
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32"
              >
                Current Max
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24"
              >
                Weight
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-36"
              >
                Edit Max Score
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-for="coCode in coKeys" :key="coCode">
              <!-- Group Header -->
              <tr class="bg-indigo-50/70 border-l-4 border-indigo-400">
                <td colspan="5" class="px-4 py-2 text-sm font-semibold text-indigo-800">
                  {{ coCode }}
                </td>
              </tr>
              <!-- Outcome Rows -->
              <tr
                v-for="co in groupedOutcomes[coCode]"
                :key="co.id"
                class="hover:bg-gray-50/80 transition-colors"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-900 align-top">
                  {{ co.co_code }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 align-top">
                  {{ co.co_description }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 text-center align-top font-semibold">
                  {{ co.co_score ?? '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 text-center align-top">
                  {{ co.co_weight }}%
                </td>
                <td class="px-4 py-3 text-center align-top">
                  <div class="flex flex-col items-center">
                    <input
                      type="number"
                      :value="formScores[co.id]"
                      @input="(e) => handleScoreChange(co.id, (e.target as HTMLInputElement).value)"
                      :class="[
                        'w-28 px-3 py-2 text-center border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                        validationErrors[co.id]
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500',
                      ]"
                      step="1"
                      :disabled="saving"
                      placeholder="Max score"
                    />
                    <p
                      v-if="validationErrors[co.id]"
                      class="text-xs text-red-500 mt-1 w-28 text-left"
                    >
                      {{ validationErrors[co.id] }}
                    </p>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-if="courseOutcomes.length === 0">
              <td colspan="5" class="px-6 py-16">
                <div class="flex flex-col items-center justify-center text-center">
                  <div
                    class="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"
                  >
                    <PhInfo :size="24" weight="bold" class="text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-500">No course outcomes found for this course.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
        <button
          type="button"
          @click="handleClose"
          :disabled="saving"
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="saving || courseOutcomes.length === 0"
          class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PhSpinner v-if="saving" :size="18" class="animate-spin" />
          {{ saving ? 'Saving...' : 'Update Max Scores' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  PhPencil,
  PhX,
  PhSpinner,
  PhWarningCircle,
  PhInfo,
  PhClock,
  PhCheckCircle,
  PhCircle,
} from '@phosphor-icons/vue'

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
  co_score: number | null // This is the MAX SCORE, can be null
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
  props.courseOutcomes.forEach((co) => {
    formScores.value[co.id] = co.co_score || ''
  })
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

// Watch for courseOutcomes changes
watch(
  () => props.courseOutcomes,
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
    validationErrors.value[co.id] = 'Max score cannot be negative'
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
  const updatedOutcomes = props.courseOutcomes.map((co) => ({
    ...co,
    co_score: formScores.value[co.id] ? parseFloat(String(formScores.value[co.id])) : null,
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
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
    case 'Not Started':
      return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
    default:
      return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
  }
}

const getStatusIconComponent = (status: string) => {
  switch (status) {
    case 'In Progress':
      return PhSpinner
    case 'Not Started':
      return PhClock
    case 'Completed':
      return PhCheckCircle
    default:
      return PhCircle
  }
}
</script>
