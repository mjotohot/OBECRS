<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/useCourseStore'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import { getStudentsByCourse, getEnrollmentsByCourse } from '@/services/student.service'
import {
  getCourseOutcomeByCourse,
  getCoursesByAdviser,
  type Course,
} from '@/services/courses.service'
import { getGradesByEnrollments } from '@/services/grades.service'
import { getCurrentUser } from '@/services/auth.service'
import type { Student } from '@/types/studentTypes'
import { PhCheckCircle, PhXCircle, PhArrowLeft, PhCaretDown } from '@phosphor-icons/vue'

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
const store = useCourseStore()
const selectedCourse = ref<Course | null>(store.selectedCourse)

const loading = ref(true)
const error = ref<string | null>(null)
const students = ref<Student[]>([])
const courseOutcomes = ref<CourseOutcome[]>([])
const enrollmentMap = ref<Record<number, number>>({})
const scores = ref<Record<number, Record<number, string | number>>>({})

// New: Course dropdown state
const allCourses = ref<Course[]>([])
const loadingCourses = ref(false)
const currentUser = ref<any>(null)

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

// Get score for a student and CO
const getScore = (studentId: number, coId: number) => {
  return scores.value[studentId]?.[coId] ?? ''
}

// Get score percentage for a CO
const getScorePercentage = (studentId: number, co: CourseOutcome): number => {
  const raw = getScore(studentId, co.id)
  const score = parseFloat(String(raw))
  if (isNaN(score) || co.co_score === 0) return 0
  return Math.round((score / co.co_score) * co.co_weight)
}

// Get CO attainment for a student
const getCoAttainment = (studentId: number, coCode: string): number | null => {
  const outcomes = groupedOutcomes.value[coCode] || []
  if (!outcomes.length) return null

  const totalWeight = outcomes.reduce((sum, co) => sum + co.co_weight, 0)
  if (totalWeight === 0) return null

  const hasAnyScore = outcomes.some((co) => getScore(studentId, co.id) !== '')
  if (!hasAnyScore) return null

  const sumPercentages = outcomes.reduce((sum, co) => {
    return sum + getScorePercentage(studentId, co)
  }, 0)

  return Math.round((sumPercentages / totalWeight) * 100)
}

// Get Final WA for a student
const getFinalWA = (studentId: number): number => {
  return coKeys.value.reduce((total, coCode) => {
    const outcomes = groupedOutcomes.value[coCode] || []
    return (
      total +
      outcomes.reduce((sum, co) => {
        return sum + getScorePercentage(studentId, co)
      }, 0)
    )
  }, 0)
}

// Get grade equivalent
const getGradeEquivalent = (wa: number): { numerical: number; letter: string } => {
  if (wa >= 97) return { numerical: 1.0, letter: 'A' }
  if (wa >= 93) return { numerical: 1.25, letter: 'A-' }
  if (wa >= 89) return { numerical: 1.5, letter: 'B+' }
  if (wa >= 85) return { numerical: 1.75, letter: 'B' }
  if (wa >= 80) return { numerical: 2.0, letter: 'B-' }
  if (wa >= 75) return { numerical: 2.25, letter: 'C+' }
  if (wa >= 70) return { numerical: 2.5, letter: 'C' }
  if (wa >= 65) return { numerical: 2.75, letter: 'C-' }
  if (wa >= 60) return { numerical: 3.0, letter: 'D' }
  return { numerical: 5.0, letter: 'F' }
}

// Check if student has any final WA
const hasFinalWA = (studentId: number): boolean => {
  return coKeys.value.some((coCode) =>
    (groupedOutcomes.value[coCode] || []).some((co) => getScore(studentId, co.id) !== ''),
  )
}

// Calculate class attainment statistics for each CO
const getClassAttainmentStats = (coCode: string) => {
  const studentsWithGrades = students.value.filter((s) => hasFinalWA(s.id))
  const totalStudents = studentsWithGrades.length

  if (totalStudents === 0) {
    return {
      percentage: 0,
      studentsMetTarget: 0,
      totalStudents: 0,
      belowTarget: true,
    }
  }

  const studentsMetTarget = studentsWithGrades.filter((s) => {
    const attainment = getCoAttainment(s.id, coCode)
    return attainment !== null && attainment >= 60
  }).length

  const percentage = Math.round((studentsMetTarget / totalStudents) * 100)

  return {
    percentage,
    studentsMetTarget,
    totalStudents,
    belowTarget: percentage < 60,
  }
}

// Get CO description (first outcome in group)
const getCoDescription = (coCode: string): string => {
  const outcomes = groupedOutcomes.value[coCode]
  return outcomes?.[0]?.co_description || ''
}

// Fetch all courses for the dropdown
const fetchAllCourses = async () => {
  loadingCourses.value = true
  try {
    if (!currentUser.value) return

    const coursesResponse = await getCoursesByAdviser(+currentUser.value.id)

    if (coursesResponse.error) {
      console.error('Error fetching courses:', coursesResponse.error)
    } else {
      // Filter courses that have status "In Progress" or "Completed" (courses with data)
      allCourses.value = (coursesResponse.data || []).filter(
        (c: Course) => c.status === 'In Progress' || c.status === 'Completed',
      )
    }
  } catch (err) {
    console.error('Error fetching courses:', err)
  } finally {
    loadingCourses.value = false
  }
}

// Fetch data for selected course
const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    if (!selectedCourse.value) {
      error.value = 'No course selected'
      return
    }

    const [outcomesRes, studentsRes, enrollmentsRes] = await Promise.all([
      getCourseOutcomeByCourse(+selectedCourse.value.id),
      getStudentsByCourse(+selectedCourse.value.id),
      getEnrollmentsByCourse(+selectedCourse.value.id),
    ])

    if (outcomesRes.error) error.value = outcomesRes.error
    else courseOutcomes.value = (outcomesRes.data as unknown as CourseOutcome[]) || []

    if (studentsRes.error) error.value = studentsRes.error
    else students.value = studentsRes.data || []

    if (enrollmentsRes.error) {
      error.value = enrollmentsRes.error
      return
    }

    if (enrollmentsRes.data) {
      enrollmentMap.value = {}
      const enrollmentIds: number[] = []

      for (const enrollment of enrollmentsRes.data) {
        enrollmentMap.value[enrollment.student_id] = enrollment.id
        enrollmentIds.push(enrollment.id)
      }

      if (enrollmentIds.length > 0) {
        const gradesRes = await getGradesByEnrollments(enrollmentIds)

        if (!gradesRes.error && gradesRes.data) {
          scores.value = {}

          const reverseMap: Record<number, number> = {}
          for (const [studentId, enrollmentId] of Object.entries(enrollmentMap.value)) {
            reverseMap[enrollmentId] = +studentId
          }

          for (const grade of gradesRes.data) {
            const studentId = reverseMap[grade.enrollment_id]
            if (studentId === undefined) continue
            if (!scores.value[studentId]) scores.value[studentId] = {}
            scores.value[studentId][grade.course_outcome_id] = grade.score
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = 'Failed to load data'
  } finally {
    loading.value = false
  }
}

// Handle course change from dropdown
const handleCourseChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const courseId = parseInt(target.value)
  const course = allCourses.value.find((c) => c.id === courseId)

  if (course) {
    selectedCourse.value = course
    // Update store as well so navigation remains consistent
    store.setCourse(course)
    fetchData()
  }
}

const goBack = () => {
  router.push({ name: 'Courses' })
}

onMounted(async () => {
  const userResponse = await getCurrentUser()
  if (userResponse.data) {
    currentUser.value = userResponse.data
    await fetchAllCourses()
    await fetchData()
  }
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-8">
      <!-- Header with Course Dropdown -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex-1">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            CO Attainment Report
          </h1>
          <p class="mt-1 text-base text-gray-600" v-if="selectedCourse">
            {{ selectedCourse.course_code }} - {{ selectedCourse.course_title }} (Section
            {{ selectedCourse.section }})
          </p>
        </div>

        <!-- Course Dropdown -->
        <div class="relative inline-block min-w-75">
          <label for="course-select" class="block text-xs font-medium text-gray-700 mb-1">
            Switch Course
          </label>
          <div class="relative">
            <select
              id="course-select"
              :value="selectedCourse?.id"
              @change="handleCourseChange"
              :disabled="loadingCourses || allCourses.length === 0"
              class="block w-full px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <option value="" disabled v-if="allCourses.length === 0">No courses available</option>
              <option v-for="course in allCourses" :key="course.id" :value="course.id">
                {{ course.course_code }} - {{ course.course_title }} ({{ course.section }})
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <PhCaretDown :size="16" class="text-gray-400" weight="bold" />
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-16">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"
        ></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p class="text-red-800 font-medium">{{ error }}</p>
        <button
          @click="fetchData"
          class="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
        >
          Try Again
        </button>
      </div>

      <!-- CO Attainment Cards -->
      <div v-else class="space-y-8">
        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="coCode in coKeys"
            :key="coCode"
            class="bg-white rounded-2xl shadow-sm border-2 border-red-200 p-6 space-y-4"
          >
            <!-- CO Header -->
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-2xl font-bold text-gray-900">{{ coCode }}</h3>
                <p class="mt-1 text-sm text-gray-600 leading-relaxed">
                  {{ getCoDescription(coCode) }}
                </p>
              </div>
              <PhXCircle
                :size="32"
                weight="fill"
                class="text-red-500 shrink-0"
                v-if="getClassAttainmentStats(coCode).belowTarget"
              />
              <PhCheckCircle :size="32" weight="fill" class="text-green-500 shrink-0" v-else />
            </div>

            <!-- Percentage -->
            <div>
              <div class="text-5xl font-bold text-gray-900">
                {{ getClassAttainmentStats(coCode).percentage }}%
              </div>
              <div class="text-sm text-gray-600 mt-1">Class Attainment</div>
            </div>

            <!-- Stats -->
            <div class="pt-4 border-t border-gray-100 space-y-1">
              <p class="text-sm text-gray-700">
                <span class="font-semibold">{{
                  getClassAttainmentStats(coCode).studentsMetTarget
                }}</span>
                of
                <span class="font-semibold">{{
                  getClassAttainmentStats(coCode).totalStudents
                }}</span>
                students met 60% target
              </p>
              <p
                :class="[
                  'text-sm font-semibold',
                  getClassAttainmentStats(coCode).belowTarget ? 'text-red-600' : 'text-green-600',
                ]"
              >
                {{
                  getClassAttainmentStats(coCode).belowTarget ? '✗ Below Target' : '✓ Met Target'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Student CO Attainment Matrix -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-900">Student CO Attainment Matrix</h2>
            <p class="mt-1 text-sm text-gray-600">
              Detailed breakdown of each student's attainment per course outcome and final grade
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Student
                  </th>
                  <th
                    v-for="coCode in coKeys"
                    :key="coCode"
                    class="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    {{ coCode }} Attainment
                  </th>
                  <th
                    class="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Overall Grade
                  </th>
                  <th
                    class="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Transmuted Grade
                  </th>
                  <th
                    class="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    Letter Grade
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr
                  v-for="student in students"
                  :key="student.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <!-- Student Info -->
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-gray-900">{{ student.name }}</span>
                      <span class="text-xs text-gray-500">{{ student.id_number }}</span>
                    </div>
                  </td>

                  <!-- CO Attainments -->
                  <td v-for="coCode in coKeys" :key="coCode" class="px-6 py-4 text-center">
                    <template v-if="getCoAttainment(student.id, coCode) !== null">
                      <span
                        :class="[
                          'text-lg font-bold',
                          getCoAttainment(student.id, coCode)! >= 60
                            ? 'text-gray-900'
                            : 'text-red-600',
                        ]"
                      >
                        {{ getCoAttainment(student.id, coCode) }}%
                      </span>
                    </template>
                    <span v-else class="text-gray-400 text-sm">—</span>
                  </td>

                  <!-- Overall Grade (WA percentage) -->
                  <td class="px-6 py-4 text-center">
                    <template v-if="hasFinalWA(student.id)">
                      <span class="text-sm font-semibold text-gray-900">
                        {{ getFinalWA(student.id).toFixed(2) }}%
                      </span>
                    </template>
                    <span v-else class="text-gray-400 text-sm">—</span>
                  </td>

                  <!-- Transmuted Grade (Numerical) -->
                  <td class="px-6 py-4 text-center">
                    <template v-if="hasFinalWA(student.id)">
                      <span class="text-sm font-bold text-gray-900">
                        {{ getGradeEquivalent(getFinalWA(student.id)).numerical }}
                      </span>
                    </template>
                    <span v-else class="text-gray-400 text-sm">—</span>
                  </td>

                  <!-- Letter Grade -->
                  <td class="px-6 py-4 text-center">
                    <template v-if="hasFinalWA(student.id)">
                      <span
                        :class="[
                          'inline-flex items-center px-3 py-1 rounded-full text-sm font-bold',
                          getFinalWA(student.id) >= 60
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800',
                        ]"
                      >
                        {{ getGradeEquivalent(getFinalWA(student.id)).letter }}
                      </span>
                    </template>
                    <span v-else class="text-gray-400 text-sm">—</span>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="students.length === 0">
                  <td :colspan="coKeys.length + 4" class="px-6 py-12 text-center">
                    <p class="text-sm text-gray-500">No student data available</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
button:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

select:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}
</style>
