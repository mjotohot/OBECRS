<!-- COReportModal.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppModal from '@/components/commons/AppModal.vue'
import type { Student } from '@/types/studentTypes'

interface CourseOutcome {
  id: number
  co_code: string
  co_description: string
  co_score: number
  co_weight: number
  course_id: number
}

interface Props {
  isOpen: boolean
  students: Student[]
  courseOutcomes: CourseOutcome[]
  scores: Record<number, Record<number, string | number>>
  courseCode?: string
  courseTitle?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

// Group outcomes by CO code (CO1, CO2, CO3, etc.)
const groupedOutcomes = computed(() => {
  const groups: Record<string, CourseOutcome[]> = {}
  for (const co of props.courseOutcomes) {
    if (!groups[co.co_code]) {
      groups[co.co_code] = []
    }
    groups[co.co_code]?.push(co) // Add optional chaining
  }
  return groups
})

const coKeys = computed(() => Object.keys(groupedOutcomes.value).sort())

// Fix getCoAttainmentForStudent with proper null checks
const getCoAttainmentForStudent = (studentId: number, coCode: string): number | null => {
  const outcomes = groupedOutcomes.value[coCode]
  if (!outcomes || outcomes.length === 0) return null
  
  const totalWeight = outcomes.reduce((sum, co) => sum + co.co_weight, 0)
  if (totalWeight === 0) return null
  
  const hasAnyScore = outcomes.some((co) => getScore(studentId, co.id) !== '')
  if (!hasAnyScore) return null
  
  const sumPercentages = outcomes.reduce((sum, co) => {
    return sum + getScorePercentage(studentId, co)
  }, 0)
  
  return Math.round((sumPercentages / totalWeight) * 100)
}

// Fix coAverages computed
const coAverages = computed(() => {
  const averages: Record<string, number> = {}
  
  for (const coCode of coKeys.value) {
    const outcomes = groupedOutcomes.value[coCode]
    if (!outcomes || outcomes.length === 0) {
      averages[coCode] = 0
      continue
    }
    
    let totalAttainment = 0
    let studentCount = 0
    
    for (const student of props.students) {
      const attainment = getCoAttainmentForStudent(student.id, coCode)
      if (attainment !== null) {
        totalAttainment += attainment
        studentCount++
      }
    }
    
    averages[coCode] = studentCount > 0 ? Math.round(totalAttainment / studentCount) : 0
  }
  
  return averages
})

// Get raw score for a student and CO
const getScore = (studentId: number, coId: number): string | number => {
  return props.scores[studentId]?.[coId] ?? ''
}

// Get weighted percentage for a specific CO
const getScorePercentage = (studentId: number, co: CourseOutcome): number => {
  const raw = getScore(studentId, co.id)
  const score = parseFloat(String(raw))
  if (isNaN(score) || co.co_score === 0) return 0
  return Math.round((score / co.co_score) * co.co_weight)
}

// Get attainment class based on percentage
const getAttainmentClass = (percentage: number) => {
  if (percentage >= 80) return 'bg-green-100 text-green-700'
  if (percentage >= 60) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

// Get progress bar width and color
const getProgressBarStyle = (percentage: number) => {
  let color = 'bg-red-500'
  if (percentage >= 80) color = 'bg-green-500'
  else if (percentage >= 60) color = 'bg-yellow-500'
  
  return {
    width: `${percentage}%`,
    backgroundColor: color
  }
}

// Export report as PDF (optional)
const exportReport = () => {
  // You can implement PDF generation here
  console.log('Exporting CO Report...')
}

// Close modal
const closeModal = () => {
  emit('close')
}
</script>

<template>
  <AppModal
    :isOpen="isOpen"
    title="Course Outcomes Report"
    size="xl"
    @close="closeModal"
  >
    <template #header>
      <div class="flex justify-between items-center w-full">
        <div>
          <h3 class="text-xl font-bold text-gray-900">Course Outcomes Report</h3>
          <p class="text-sm text-gray-500 mt-1" v-if="courseCode">
            {{ courseCode }} - {{ courseTitle }}
          </p>
        </div>
        <button
          @click="exportReport"
          class="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <i class="fas fa-download mr-2"></i>
          Export Report
        </button>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Average CO Cards -->
      <div>
        <h4 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          CO Attainment Summary
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="coCode in coKeys"
            :key="coCode"
            class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <h5 class="text-lg font-bold text-indigo-700">{{ coCode }}</h5>
            </div>
            <div class="p-4">
              <div class="flex items-baseline justify-between mb-2">
                <span class="text-3xl font-bold text-gray-900">
                  {{ coAverages[coCode] || 0 }}%
                </span>
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-semibold',
                    getAttainmentClass(coAverages[coCode] || 0)
                  ]"
                >
                  {{ (coAverages[coCode] || 0) >= 60 ? 'Passing' : 'Needs Improvement' }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :style="getProgressBarStyle(coAverages[coCode] || 0)"
                ></div>
              </div>
              <p class="text-xs text-gray-500 mt-3">
                {{ groupedOutcomes[coCode]?.length || 0 }} assessment(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Simplified Student Table -->
      <div>
        <div class="flex justify-between items-center mb-3">
          <h4 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Student CO Attainment
          </h4>
          <span class="text-xs text-gray-500">
            Total Students: {{ students.length }}
          </span>
        </div>

        <div class="overflow-x-auto border border-gray-200 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Student No.
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th
                  v-for="coCode in coKeys"
                  :key="coCode"
                  class="px-4 py-3 text-center text-xs font-semibold text-indigo-600 uppercase tracking-wider"
                >
                  {{ coCode }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-purple-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr
                v-for="student in students"
                :key="student.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {{ student.id_number }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {{ student.name }}
                </td>
                <td
                  v-for="coCode in coKeys"
                  :key="coCode"
                  class="px-4 py-3 text-center"
                >
                  <template v-if="getCoAttainmentForStudent(student.id, coCode) !== null">
                    <span
                      :class="[
                        'inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold min-w-[60px]',
                        getAttainmentClass(getCoAttainmentForStudent(student.id, coCode)!)
                      ]"
                    >
                      {{ getCoAttainmentForStudent(student.id, coCode) }}%
                    </span>
                  </template>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <template v-if="coKeys.some(coCode => getCoAttainmentForStudent(student.id, coCode) !== null)">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                        coKeys.every(coCode => {
                          const attainment = getCoAttainmentForStudent(student.id, coCode)
                          return attainment === null || attainment >= 60
                        })
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      <i :class="[
                        'fas mr-1',
                        coKeys.every(coCode => {
                          const attainment = getCoAttainmentForStudent(student.id, coCode)
                          return attainment === null || attainment >= 60
                        })
                          ? 'fa-check-circle'
                          : 'fa-exclamation-circle'
                      ]"></i>
                      {{
                        coKeys.every(coCode => {
                          const attainment = getCoAttainmentForStudent(student.id, coCode)
                          return attainment === null || attainment >= 60
                        })
                          ? 'Met Expectations'
                          : 'Below Threshold'
                      }}
                    </span>
                  </template>
                  <span v-else class="text-gray-300 text-xs">No grades</span>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="students.length === 0">
                <td :colspan="3 + coKeys.length" class="px-4 py-12 text-center text-gray-400">
                  <i class="fas fa-users text-3xl mb-2"></i>
                  <p class="text-sm">No students enrolled</p>
                </td>
              </tr>
            </tbody>
           </table>
        </div>
      </div>

      <!-- Summary Legend -->
      <div class="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="text-xs text-gray-600">≥80% (Excellent)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span class="text-xs text-gray-600">60-79% (Satisfactory)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span class="text-xs text-gray-600">&lt;60% (Needs Improvement)</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          @click="closeModal"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Close
        </button>
        <button
          @click="exportReport"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <i class="fas fa-print mr-2"></i>
          Print Report
        </button>
      </div>
    </template>
  </AppModal>
</template>