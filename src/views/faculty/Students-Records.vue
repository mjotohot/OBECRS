<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import { createStudent, updateStudent, getStudentsByCourse } from '@/services/student.service'
import { getCourseOutcomeByCourse } from '@/services/courses.service'
import { getCurrentUser } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'
import StudentModal from '@/components/commons/StudentModal.vue'
import type { Student } from '@/types/studentTypes'
import EnrollmentModal from '@/components/commons/EnrollmentModal.vue'
import { useCourseStore } from '@/stores/useCourseStore'

interface CourseOutcome {
  id: number
  co_code: string
  co_description: string
  co_score: number
  co_weight: number
  course_id: number
  created_at: string
}

const router = useRouter()
const showLogoutConfirm = ref(false)
const showStudentModal = ref(false)
const showEnrollmentModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedStudent = ref<Student | null>(null)
const modalLoading = ref(false)
const students = ref<Student[]>([])
const courseOutcomes = ref<CourseOutcome[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentUser = ref<any>(null)
const store = useCourseStore()
const course = store.selectedCourse

// Group outcomes by co_code
const groupedOutcomes = computed(() => {
  const groups: Record<string, CourseOutcome[]> = {}
  for (const co of courseOutcomes.value) {
    if (!groups[co.co_code]) groups[co.co_code] = []
    groups[co.co_code]?.push(co)
  }
  return groups
})

const coKeys = computed(() => Object.keys(groupedOutcomes.value))

// Fetch course outcomes
const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    if (!course) {
      error.value = 'No course selected'
      return
    }

    const [outcomesRes, studentsRes] = await Promise.all([
      getCourseOutcomeByCourse(+course.id),
      getStudentsByCourse(+course.id)  
    ])

    if (outcomesRes.error) error.value = outcomesRes.error
    else courseOutcomes.value = (outcomesRes.data as unknown as CourseOutcome[]) || []

    if (studentsRes.error) error.value = studentsRes.error
    else students.value = studentsRes.data || []

  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = 'Failed to load data'
  } finally {
    loading.value = false
  }
}

// Scores per student: studentId -> coId -> score
const scores = ref<Record<number, Record<number, string | number>>>({})

const getScore = (studentId: number, coId: number) => {
  return scores.value[studentId]?.[coId] ?? ''
}

const setScore = (studentId: number, coId: number, value: string) => {
  if (!scores.value[studentId]) scores.value[studentId] = {}
  scores.value[studentId][coId] = value
}

// Compute CO attainment % per student per co_code
const getCoAttainment = (studentId: number, coCode: string) => {
  const outcomes = groupedOutcomes.value[coCode] || []
  if (!outcomes.length) return null
  const totalWeight = outcomes.reduce((sum, co) => sum + co.co_weight, 0)
  const achieved = outcomes.reduce((sum, co) => {
    const raw = getScore(studentId, co.id)
    const score = parseFloat(String(raw))
    if (isNaN(score)) return sum
    return sum + (score / co.co_score) * co.co_weight
  }, 0)
  return totalWeight > 0 ? (achieved / totalWeight) * 100 : null
}

const isBelowThreshold = (studentId: number) => {
  return coKeys.value.some(coCode => {
    const attainment = getCoAttainment(studentId, coCode)
    return attainment !== null && attainment < 60
  })
}

// Modals
const openAddModal = () => {
  modalMode.value = 'add'
  selectedStudent.value = null
  showStudentModal.value = true
}

const openEnrollmentModal = (student: Student) => {
  selectedStudent.value = student
  showEnrollmentModal.value = true
}

const closeEnrollmentModal = () => {
  showEnrollmentModal.value = false
  selectedStudent.value = null
}

const handleEnrollmentSuccess = () => {
  closeEnrollmentModal()
}

const openEditModal = (student: Student) => {
  modalMode.value = 'edit'
  selectedStudent.value = student
  showStudentModal.value = true
}

const handleStudentSubmit = async (formData: any) => {
  if (!currentUser.value) {
    error.value = 'User not authenticated'
    return
  }
  modalLoading.value = true
  try {
    if (modalMode.value === 'add') {
      const studentData = {
        adviser_id: currentUser.value.id,
        id_number: formData.id_number.trim(),
        name: formData.name.trim()
      }
      const response = await createStudent(studentData, currentUser.value.id)
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        students.value.unshift(response.data)
        showStudentModal.value = false
      }
    } else {
      if (!selectedStudent.value) return
      const updateData = {
        adviser_id: currentUser.value.id,
        id_number: formData.id_number.trim(),
        name: formData.name.trim()
      }
      const response = await updateStudent(selectedStudent.value.id, updateData)
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        const index = students.value.findIndex(s => s.id === response.data?.id)
        if (index !== -1) students.value[index] = response.data
        showStudentModal.value = false
      }
    }
  } catch (err) {
    console.error('Error saving student:', err)
    error.value = 'Failed to save student'
  } finally {
    modalLoading.value = false
  }
}

const handleLogoutConfirm = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const handleDeleteStudent = async (student: Student) => {
  if (confirm(`Are you sure you want to delete ${student.name}?`)) {
    console.log('Delete student:', student)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-900">Class Record</h2>
          <p class="mt-1 text-gray-500" v-if="course">
            {{ course.course_code }} - {{ course.course_title }}
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <i class="fas fa-plus mr-2"></i>
          Input Grade
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-700">{{ error }}</p>
        <button @click="fetchData" class="mt-2 text-sm text-red-600 hover:text-red-800">
          Try Again
        </button>
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Student Scores</h3>
          <p class="text-sm text-gray-500 mt-0.5">
            Enter scores for each assessment. Students with CO attainment below 60% will be highlighted in red.
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <!-- Row 1: CO group headers -->
              <tr class="bg-white border-b border-gray-200">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-white z-10 min-w-[120px]">
                  Student No.
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 sticky left-[120px] bg-white z-10 min-w-[160px]">
                  Name
                </th>
                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    :colspan="(groupedOutcomes[coCode]?.length ?? 0) + 1"
                    class="px-4 py-3 text-center text-sm font-bold text-indigo-600 border-r border-gray-200 bg-indigo-50"
                  >
                    {{ coCode }}
                  </th>
                </template>
              </tr>

              <!-- Row 2: CO descriptions + Attainment label -->
              <tr class="bg-indigo-50/40 border-b border-gray-200">
                <th class="sticky left-0 bg-white z-10 border-r border-gray-200"></th>
                <th class="sticky left-[120px] bg-white z-10 border-r border-gray-200"></th>
                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-3 py-2 text-center text-[11px] text-gray-500 font-normal border-r border-gray-100 max-w-[140px]"
                  >
                    <span class="line-clamp-2 block leading-tight">{{ co.co_description }}</span>
                  </th>
                  <th class="px-3 py-2 text-center text-[11px] font-semibold text-indigo-600 border-r border-gray-200 min-w-[90px]">
                    Attainment
                  </th>
                </template>
              </tr>

              <!-- Row 3: Score/weight info -->
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="sticky left-0 bg-gray-50 z-10 border-r border-gray-200"></th>
                <th class="sticky left-[120px] bg-gray-50 z-10 border-r border-gray-200"></th>
                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-3 py-2 text-center border-r border-gray-100"
                  >
                    <span class="block text-[11px] font-semibold text-gray-700">
                      ({{ co.co_weight }}%, Max: {{ co.co_score }})
                    </span>
                  </th>
                  <th class="border-r border-gray-200"></th>
                </template>
              </tr>
            </thead>

            <tbody class="bg-white divide-y divide-gray-100">
              <tr
                v-for="student in students"
                :key="student.id"
                :class="[
                  'hover:bg-gray-50 transition-colors duration-150',
                  isBelowThreshold(student.id) ? 'bg-red-50 hover:bg-red-100' : ''
                ]"
              >
                <td class="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit z-10">
                  {{ student.id_number }}
                </td>
                <td class="px-4 py-3 text-gray-800 border-r border-gray-200 sticky left-[120px] bg-inherit z-10 whitespace-nowrap">
                  {{ student.name }}
                </td>
                <template v-for="coCode in coKeys" :key="coCode">
                  <td
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-2 py-3 text-center border-r border-gray-100"
                  >
                    <input
                      type="number"
                      :min="0"
                      :max="co.co_score"
                      :value="getScore(student.id, co.id)"
                      @input="setScore(student.id, co.id, ($event.target as HTMLInputElement).value)"
                      class="w-16 text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                      placeholder="—"
                    />
                  </td>

                  <!-- Attainment % cell per CO group -->
                  <td class="px-3 py-3 text-center border-r border-gray-200">
                    <template v-if="getCoAttainment(student.id, coCode) !== null">
                      <span
                        :class="[
                          'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                          getCoAttainment(student.id, coCode)! >= 60
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        ]"
                      >
                        {{ getCoAttainment(student.id, coCode)!.toFixed(1) }}%
                      </span>
                    </template>
                    <span v-else class="text-gray-300 text-xs">—</span>
                  </td>
                </template>
              </tr>

              <!-- Empty state -->
              <tr v-if="students.length === 0">
                <td
                  :colspan="2 + courseOutcomes.length + coKeys.length"
                  class="px-6 py-12 text-center text-gray-400"
                >
                  <i class="fas fa-user-graduate text-4xl mb-3 block"></i>
                  No students found. Add students to start entering grades.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modals -->
      <AppModal
        :isOpen="showLogoutConfirm"
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="error"
        @confirm="handleLogoutConfirm"
        @cancel="showLogoutConfirm = false"
      />

      <StudentModal
        :isOpen="showStudentModal"
        :mode="modalMode"
        :student="selectedStudent"
        :loading="modalLoading"
        @close="showStudentModal = false"
        @submit="handleStudentSubmit"
      />

      <EnrollmentModal
        :isOpen="showEnrollmentModal"
        :student="selectedStudent"
        @close="closeEnrollmentModal"
        @success="handleEnrollmentSuccess"
      />
    </div>
  </AdminLayout>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>