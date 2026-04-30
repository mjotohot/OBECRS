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
import { PhCheckCircle, PhXCircle, PhArrowLeft, PhCaretDown, PhChartBar } from '@phosphor-icons/vue'

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

const allCourses = ref<Course[]>([])
const loadingCourses = ref(false)
const currentUser = ref<any>(null)

const groupedOutcomes = computed(() => {
  const groups: Record<string, CourseOutcome[]> = {}
  for (const co of courseOutcomes.value) {
    if (!groups[co.co_code]) groups[co.co_code] = []
    groups[co.co_code]?.push(co)
  }
  return groups
})

const coKeys = computed(() => Object.keys(groupedOutcomes.value))

const getScore = (studentId: number, coId: number) => {
  return scores.value[studentId]?.[coId] ?? ''
}

const getScorePercentage = (studentId: number, co: CourseOutcome): number => {
  const raw = getScore(studentId, co.id)
  const score = parseFloat(String(raw))
  if (isNaN(score) || co.co_score === 0) return 0
  return Math.round((score / co.co_score) * co.co_weight)
}

const getCoAttainment = (studentId: number, coCode: string): number | null => {
  const outcomes = groupedOutcomes.value[coCode] || []
  if (!outcomes.length) return null
  const totalWeight = outcomes.reduce((sum, co) => sum + co.co_weight, 0)
  if (totalWeight === 0) return null
  const hasAnyScore = outcomes.some((co) => getScore(studentId, co.id) !== '')
  if (!hasAnyScore) return null
  const sumPercentages = outcomes.reduce((sum, co) => sum + getScorePercentage(studentId, co), 0)
  return Math.round((sumPercentages / totalWeight) * 100)
}

const getFinalWA = (studentId: number): number => {
  return coKeys.value.reduce((total, coCode) => {
    const outcomes = groupedOutcomes.value[coCode] || []
    return total + outcomes.reduce((sum, co) => sum + getScorePercentage(studentId, co), 0)
  }, 0)
}

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

const hasFinalWA = (studentId: number): boolean => {
  return coKeys.value.some((coCode) =>
    (groupedOutcomes.value[coCode] || []).some((co) => getScore(studentId, co.id) !== ''),
  )
}

const getClassAttainmentStats = (coCode: string) => {
  const studentsWithGrades = students.value.filter((s) => hasFinalWA(s.id))
  const totalStudents = studentsWithGrades.length
  if (totalStudents === 0)
    return { percentage: 0, studentsMetTarget: 0, totalStudents: 0, belowTarget: true }
  const studentsMetTarget = studentsWithGrades.filter((s) => {
    const attainment = getCoAttainment(s.id, coCode)
    return attainment !== null && attainment >= 60
  }).length
  const percentage = Math.round((studentsMetTarget / totalStudents) * 100)
  return { percentage, studentsMetTarget, totalStudents, belowTarget: percentage < 60 }
}

const getCoDescription = (coCode: string): string => {
  const outcomes = groupedOutcomes.value[coCode]
  return outcomes?.[0]?.co_description || ''
}

// Overall summary stats
const summaryStats = computed(() => {
  const total = coKeys.value.length
  const met = coKeys.value.filter((co) => !getClassAttainmentStats(co).belowTarget).length
  return { total, met, notMet: total - met }
})

const fetchAllCourses = async () => {
  loadingCourses.value = true
  try {
    if (!currentUser.value) return
    const coursesResponse = await getCoursesByAdviser(+currentUser.value.id)
    if (!coursesResponse.error) {
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

const handleCourseChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const courseId = parseInt(target.value)
  const course = allCourses.value.find((c) => c.id === courseId)
  if (course) {
    selectedCourse.value = course
    store.setCourse(course)
    fetchData()
  }
}

const goBack = () => router.push('/faculty/courses')

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
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="flex-1">
          <button
            @click="goBack"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors mb-3 group"
          >
            <PhArrowLeft :size="13" class="group-hover:-translate-x-0.5 transition-transform" />
            Back to Courses
          </button>
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            CO Attainment Report
          </h1>
          <p class="mt-1 text-sm text-slate-500" v-if="selectedCourse">
            {{ selectedCourse.course_code }} · {{ selectedCourse.course_title }} ·
            <span class="font-semibold text-slate-600">Section {{ selectedCourse.section }}</span>
          </p>
        </div>

        <!-- Course Dropdown -->
        <div class="shrink-0 w-full sm:w-72">
          <label
            for="course-select"
            class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5"
          >
            Switch Course
          </label>
          <div class="relative">
            <select
              id="course-select"
              :value="selectedCourse?.id"
              @change="handleCourseChange"
              :disabled="loadingCourses || allCourses.length === 0"
              class="block w-full pl-3.5 pr-10 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-xl shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
            >
              <option value="" disabled v-if="allCourses.length === 0">No courses available</option>
              <option v-for="course in allCourses" :key="course.id" :value="course.id">
                {{ course.course_code }} – {{ course.course_title }} ({{ course.section }})
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <PhCaretDown :size="14" weight="bold" class="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <div
          class="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"
        ></div>
        <p class="text-sm text-slate-400 font-medium">Loading attainment data…</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4"
      >
        <PhXCircle :size="22" weight="fill" class="text-red-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-red-800">Failed to load data</p>
          <p class="text-sm text-red-600 mt-0.5">{{ error }}</p>
          <button
            @click="fetchData"
            class="mt-3 text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- CO Attainment Cards + Table -->
      <div v-else class="space-y-8">
        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="coCode in coKeys"
            :key="coCode"
            class="bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-shadow hover:shadow-md"
            :class="
              getClassAttainmentStats(coCode).belowTarget ? 'border-rose-200' : 'border-emerald-200'
            "
          >
            <!-- Accent bar -->
            <div
              class="h-1 w-full"
              :class="
                getClassAttainmentStats(coCode).belowTarget ? 'bg-rose-400' : 'bg-emerald-400'
              "
            ></div>

            <div class="p-6 space-y-4">
              <!-- CO Header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="text-xs font-bold px-2 py-0.5 rounded-md tracking-wide"
                      :class="
                        getClassAttainmentStats(coCode).belowTarget
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      "
                    >
                      {{ coCode }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-slate-600 leading-snug line-clamp-2">
                    {{ getCoDescription(coCode) }}
                  </p>
                </div>
                <PhXCircle
                  v-if="getClassAttainmentStats(coCode).belowTarget"
                  :size="28"
                  weight="fill"
                  class="text-rose-400 shrink-0"
                />
                <PhCheckCircle v-else :size="28" weight="fill" class="text-emerald-500 shrink-0" />
              </div>

              <!-- Percentage + progress bar -->
              <div>
                <div class="flex items-end justify-between mb-2">
                  <div class="text-5xl font-bold text-slate-900 leading-none">
                    {{ getClassAttainmentStats(coCode).percentage
                    }}<span class="text-2xl text-slate-400">%</span>
                  </div>
                  <span class="text-xs text-slate-400 font-medium mb-1">Class Attainment</span>
                </div>
                <!-- Bar -->
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :class="
                      getClassAttainmentStats(coCode).belowTarget ? 'bg-rose-400' : 'bg-emerald-400'
                    "
                    :style="{ width: `${getClassAttainmentStats(coCode).percentage}%` }"
                  ></div>
                </div>
                <!-- 60% marker -->
                <div class="relative h-4 mt-0.5">
                  <div
                    class="absolute top-0 flex flex-col items-center"
                    style="left: 60%; transform: translateX(-50%)"
                  >
                    <div class="w-px h-2 bg-slate-400"></div>
                    <span class="text-[10px] text-slate-400 font-medium leading-none mt-0.5"
                      >60%</span
                    >
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="pt-3 border-t border-slate-100 space-y-1">
                <p class="text-sm text-slate-500">
                  <span class="font-bold text-slate-700">{{
                    getClassAttainmentStats(coCode).studentsMetTarget
                  }}</span>
                  of
                  <span class="font-bold text-slate-700">{{
                    getClassAttainmentStats(coCode).totalStudents
                  }}</span>
                  students met 60% target
                </p>
                <p
                  class="text-sm font-semibold"
                  :class="
                    getClassAttainmentStats(coCode).belowTarget
                      ? 'text-rose-500'
                      : 'text-emerald-600'
                  "
                >
                  {{
                    getClassAttainmentStats(coCode).belowTarget ? '✗ Below Target' : '✓ Met Target'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Student CO Attainment Matrix -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Student CO Attainment Matrix</h2>
              <p class="mt-0.5 text-sm text-slate-500">
                Detailed breakdown of each student's attainment per course outcome and final grade
              </p>
            </div>
            <span
              class="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0"
            >
              {{ students.length }} students
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th
                    class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Student
                  </th>
                  <th
                    v-for="coCode in coKeys"
                    :key="coCode"
                    class="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ coCode }} Attainment
                  </th>
                  <th
                    class="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Overall Grade
                  </th>
                  <th
                    class="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Transmuted Grade
                  </th>
                  <th
                    class="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Letter Grade
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(student, idx) in students"
                  :key="student.id"
                  class="hover:bg-slate-50/70 transition-colors group"
                  :class="idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'"
                >
                  <!-- Student -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 uppercase"
                      >
                        {{ student.name?.charAt(0) ?? '?' }}
                      </div>
                      <div>
                        <div class="text-sm font-semibold text-slate-800 leading-tight">
                          {{ student.name }}
                        </div>
                        <div class="text-xs text-slate-400">{{ student.id_number }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- CO Attainments -->
                  <td v-for="coCode in coKeys" :key="coCode" class="px-5 py-4 text-center">
                    <template v-if="getCoAttainment(student.id, coCode) !== null">
                      <div class="inline-flex flex-col items-center gap-1">
                        <span
                          class="text-sm font-bold"
                          :class="
                            getCoAttainment(student.id, coCode)! >= 60
                              ? 'text-slate-800'
                              : 'text-rose-600'
                          "
                        >
                          {{ getCoAttainment(student.id, coCode) }}%
                        </span>
                        <div class="w-14 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            :class="
                              getCoAttainment(student.id, coCode)! >= 60
                                ? 'bg-emerald-400'
                                : 'bg-rose-400'
                            "
                            :style="{
                              width: `${Math.min(getCoAttainment(student.id, coCode)!, 100)}%`,
                            }"
                          ></div>
                        </div>
                      </div>
                    </template>
                    <span v-else class="text-slate-300 text-sm select-none">—</span>
                  </td>

                  <!-- Overall WA -->
                  <td class="px-5 py-4 text-center">
                    <template v-if="hasFinalWA(student.id)">
                      <span class="text-sm font-semibold text-slate-700 tabular-nums">
                        {{ getFinalWA(student.id).toFixed(2) }}%
                      </span>
                    </template>
                    <span v-else class="text-slate-300 text-sm select-none">—</span>
                  </td>

                  <!-- Numerical -->
                  <td class="px-5 py-4 text-center">
                    <template v-if="hasFinalWA(student.id)">
                      <span class="text-sm font-bold text-slate-700 tabular-nums">
                        {{ getGradeEquivalent(getFinalWA(student.id)).numerical.toFixed(2) }}
                      </span>
                    </template>
                    <span v-else class="text-slate-300 text-sm select-none">—</span>
                  </td>

                  <!-- Letter Grade -->
                  <td class="px-5 py-4 text-center">
                    <template v-if="hasFinalWA(student.id)">
                      <span
                        class="inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-extrabold tracking-wide ring-1"
                        :class="
                          getFinalWA(student.id) >= 60
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-rose-50 text-rose-700 ring-rose-200'
                        "
                      >
                        {{ getGradeEquivalent(getFinalWA(student.id)).letter }}
                      </span>
                    </template>
                    <span v-else class="text-slate-300 text-sm select-none">—</span>
                  </td>
                </tr>

                <tr v-if="students.length === 0">
                  <td :colspan="coKeys.length + 4" class="px-6 py-12 text-center">
                    <p class="text-sm text-slate-400">No student data available</p>
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
button:focus-visible,
select:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
