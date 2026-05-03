<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import {
  createStudent,
  updateStudent,
  getStudentsByCourse,
  getEnrollmentsByCourse,
} from '@/services/student.service'
import Pagination from '@/components/commons/Pagination.vue'
import { getCourseOutcomeByCourse } from '@/services/courses.service'
import { getCurrentUser } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'
import StudentModal from '@/components/commons/StudentModal.vue'
import type { Student } from '@/types/studentTypes'
import EnrollmentModal from '@/components/commons/EnrollmentModal.vue'
import GradeModal from '@/components/commons/GradeModal.vue'
import { useCourseStore } from '@/stores/useCourseStore'
import { getGradesByEnrollments, bulkUpsertGrades } from '@/services/grades.service'
import { PhArrowLeft, PhPlus, PhFilePdf, PhCaretDown, PhPencilSimple } from '@phosphor-icons/vue'

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
const goBack = () => router.push('/chairperson/class-record')

const showLogoutConfirm = ref(false)
const showStudentModal = ref(false)
const showEnrollmentModal = ref(false)
const showGradeModal = ref(false)
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
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isloading = ref(false)

// Grade modal specific refs
const selectedStudentForGrade = ref<Student | null>(null)
const gradeFormScores = ref<Record<number, string | number>>({})
const savingGrade = ref(false)
const gradeModalError = ref<string | null>(null)

// enrollmentId map: studentId -> enrollmentId
const enrollmentMap = ref<Record<number, number>>({})

// scores: studentId -> coId -> score value
const scores = ref<Record<number, Record<number, number>>>({})

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

// Get students without any grades
const studentsWithoutGrades = computed(() => {
  return students.value.filter((student) => {
    const studentScores = scores.value[student.id]
    if (!studentScores) return true
    return Object.keys(studentScores).length === 0
  })
})

// Get existing scores for a student
const getExistingScoresForStudent = (studentId: number): Record<number, string | number> => {
  return scores.value[studentId] || {}
}

// Fetch course outcomes, students, enrollments, and grades
const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    if (!course) {
      error.value = 'No course selected'
      return
    }

    const [outcomesRes, studentsRes, enrollmentsRes] = await Promise.all([
      getCourseOutcomeByCourse(+course.id),
      getStudentsByCourse(+course.id),
      getEnrollmentsByCourse(+course.id),
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

          // Reverse map: enrollmentId -> studentId
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

  const sumPercentages = outcomes.reduce((sum, co) => {
    return sum + getScorePercentage(studentId, co)
  }, 0)

  return Math.round((sumPercentages / totalWeight) * 100)
}

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
  return { numerical: 5.0, letter: 'E' }
}

const hasFinalWA = (studentId: number): boolean => {
  return coKeys.value.some((coCode) =>
    (groupedOutcomes.value[coCode] || []).some((co) => getScore(studentId, co.id) !== ''),
  )
}

const isBelowThreshold = (studentId: number) => {
  return coKeys.value.some((coCode) => {
    const attainment = getCoAttainment(studentId, coCode)
    return attainment !== null && attainment < 60
  })
}

// Open grade modal for a specific student
const openGradeModal = (student: Student) => {
  selectedStudentForGrade.value = student
  gradeModalError.value = null
  showGradeModal.value = true
}

// Open grade modal for first student without grades (from dropdown)
const openGradeModalForStudentWithoutGrades = () => {
  if (studentsWithoutGrades.value.length > 0) {
    openGradeModal(studentsWithoutGrades.value[0]!)
  } else if (students.value.length > 0) {
    openGradeModal(students.value[0]!)
  } else {
    error.value = 'No students available'
  }
}

// Handle grade submission
const handleGradeSubmit = async (scores: Record<number, string | number>) => {
  if (!selectedStudentForGrade.value || !course) return

  savingGrade.value = true
  gradeModalError.value = null

  try {
    const enrollmentId = enrollmentMap.value[selectedStudentForGrade.value.id]
    if (!enrollmentId) {
      gradeModalError.value = 'Student is not enrolled in this course'
      savingGrade.value = false
      return
    }

    const gradesToSave = []
    for (const co of courseOutcomes.value) {
      const score = scores[co.id]
      if (score !== '' && score !== null && score !== undefined) {
        const scoreNum = parseFloat(String(score))
        if (!isNaN(scoreNum)) {
          gradesToSave.push({
            course_outcome_id: co.id,
            score: scoreNum,
          })
        }
      }
    }

    if (gradesToSave.length === 0) {
      gradeModalError.value = 'Please enter at least one grade'
      savingGrade.value = false
      return
    }

    const result = await bulkUpsertGrades({
      enrollment_id: enrollmentId,
      grades: gradesToSave,
    })

    if (result.error) {
      gradeModalError.value = result.error
    } else {
      await fetchData()
      showGradeModal.value = false
      selectedStudentForGrade.value = null
    }
  } catch (err) {
    console.error('Error saving grades:', err)
    gradeModalError.value = 'Failed to save grades'
  } finally {
    savingGrade.value = false
  }
}

const closeGradeModal = () => {
  showGradeModal.value = false
  selectedStudentForGrade.value = null
  gradeModalError.value = null
}

// Other modal handlers
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
  fetchData()
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
        name: formData.name.trim(),
      }
      const response = await createStudent(studentData, currentUser.value.id)
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        students.value.unshift(response.data)
        showStudentModal.value = false
        fetchData()
      }
    } else {
      if (!selectedStudent.value) return
      const updateData = {
        adviser_id: currentUser.value.id,
        id_number: formData.id_number.trim(),
        name: formData.name.trim(),
      }
      const response = await updateStudent(selectedStudent.value.id, updateData)
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        const index = students.value.findIndex((s) => s.id === response.data?.id)
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

const pdfTemplate = computed(() => {
  const groups: Record<string, CourseOutcome[]> = {}
  for (const co of courseOutcomes.value) {
    if (!groups[co.co_code]) groups[co.co_code] = []
    groups[co.co_code]!.push(co)
  }

  const coGroups = Object.entries(groups).map(([code, outcomes]) => ({
    code,
    assessments: outcomes.map((co) => ({
      abbreviation: co.co_description.substring(0, 6),
      maxScore: co.co_score,
      weight: co.co_weight,
      origId: co.id,
    })),
  }))

  const weightPcts = coGroups.flatMap((co) =>
    co.assessments.map((a) => (a.weight > 0 ? `${a.weight}%` : '—')),
  )

  return {
    coGroups,
    weightPcts,
  }
})

const pdfStudents = computed(() => {
  const tpl = pdfTemplate.value
  const allAssessments = tpl.coGroups.flatMap((g) => g.assessments)

  return students.value.map((student) => {
    const rawScores = allAssessments.map((assess) => {
      if (assess.origId === null) return 0
      const co = courseOutcomes.value.find((c) => c.id === assess.origId)
      return co ? parseFloat(String(getScore(student.id, co.id))) || 0 : 0
    })

    const percentages = allAssessments.map((assess, i) => {
      if (assess.origId === null) return '—'
      const score = rawScores[i]!
      return assess.maxScore ? ((score / assess.maxScore) * 100).toFixed(1) : '0.0'
    })

    const coAttainments = coKeys.value.map((coCode) => getCoAttainment(student.id, coCode) ?? 0)
    const finalWA = getFinalWA(student.id)
    const grade = getGradeEquivalent(finalWA)
    const below = isBelowThreshold(student.id)

    return {
      id: student.id,
      name: student.name,
      rawScores,
      percentages,
      co1Weight: tpl.coGroups[0]?.assessments.reduce((s, a) => s + a.weight, 0) ?? 0,
      co2Weight: tpl.coGroups[1]?.assessments.reduce((s, a) => s + a.weight, 0) ?? 0,
      co3Weight: tpl.coGroups[2]?.assessments.reduce((s, a) => s + a.weight, 0) ?? 0,
      co1Percent: coAttainments[0],
      co2Percent: coAttainments[1],
      co3Percent: coAttainments[2],
      finalWA,
      finalGrade: grade.numerical.toFixed(2),
      remarks: below ? 'Failed' : 'Pass',
      intervention: below ? 'Intervention Failed' : '',
      finalGradeAfter: '',
    }
  })
})

const exportPDF = async () => {
  isloading.value = true
  try {
    const tpl = pdfTemplate.value
    const payload = {
      students: pdfStudents.value,
      courseInfo: {
        title: `${course?.course_code} - ${course?.course_title}` || 'Class Record',
        semAy: '1ST SEMESTER / AY 2025 - 2026',
      },
      template: {
        coGroups: tpl.coGroups,
        weightPcts: tpl.weightPcts,
      },
    }

    const res = await fetch(
      'https://xgegivpmktyunrwmaktp.supabase.co/functions/v1/generated-class-record',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Server error')
    }

    const json = await res.json()
    if (!json.html) throw new Error('Missing html')

    const printWindow = window.open('', '_blank')
    if (!printWindow) throw new Error('Popup blocked — allow popups for this site')

    printWindow.document.write(json.html)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
  } catch (error) {
    console.error('PDF export failed:', error)
    alert('Failed to generate PDF')
  } finally {
    isloading.value = false
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

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return students.value.slice(start, start + itemsPerPage.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  fetchData()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            @click="goBack"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors mb-3 group"
          >
            <PhArrowLeft :size="13" class="group-hover:-translate-x-0.5 transition-transform" />
            Back to Class Records
          </button>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            My Class Record
          </h2>
          <p class="mt-1 text-sm text-slate-500" v-if="course">
            {{ course.course_code }} · {{ course.course_title }}
          </p>
        </div>

        <!-- Dropdown and Action Buttons -->
        <div class="flex items-center gap-3">
          <!-- Dropdown for students without grades -->
          <div class="relative" v-if="studentsWithoutGrades.length > 0">
            <select
              @change="openGradeModalForStudentWithoutGrades"
              class="appearance-none pl-3.5 pr-10 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="" disabled selected>Select student without grades</option>
              <option
                v-for="student in studentsWithoutGrades"
                :key="student.id"
                :value="student.id"
              >
                {{ student.id_number }} - {{ student.name }}
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <PhCaretDown :size="14" weight="bold" class="text-slate-400" />
            </div>
          </div>

          <!-- Input Grade Button -->
          <button
            @click="openGradeModalForStudentWithoutGrades"
            class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PhPlus :size="16" weight="bold" class="mr-1.5" />
            Input Grade
          </button>
          <!-- Export PDF Button -->
          <button
            @click="exportPDF"
            :disabled="isloading"
            class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <PhFilePdf :size="16" weight="bold" class="mr-1.5" />
            {{ isloading ? 'Generating PDF...' : 'Export to PDF' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"
        ></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4">
        <p class="text-red-700">{{ error }}</p>
        <button @click="fetchData" class="mt-2 text-sm text-red-600 hover:text-red-800 underline">
          Try Again
        </button>
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200">
          <h3 class="text-lg font-bold text-slate-900">Student Scores</h3>
          <p class="mt-0.5 text-sm text-slate-500">
            View scores for each assessment. Students with CO attainment below 60% are highlighted
            in red.
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <!-- CO Group Header -->
              <tr class="bg-white border-b border-slate-200">
                <th
                  class="sticky left-0 z-30 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 min-w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                >
                  Student No.
                </th>
                <th
                  class="sticky left-32 z-30 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 min-w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                >
                  Name
                </th>
                <th
                  class="sticky left-80 z-10 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 min-w-24 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                >
                  Actions
                </th>
                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    :colspan="(groupedOutcomes[coCode]?.length ?? 0) + 1"
                    class="px-4 py-3 text-center text-sm font-bold text-indigo-600 border-r border-slate-200 bg-indigo-50"
                  >
                    {{ coCode }}
                  </th>
                </template>
                <th
                  class="px-4 py-3 text-center text-sm font-bold text-violet-600 border-r border-slate-200 bg-violet-50 min-w-24"
                >
                  Final WA
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-bold text-violet-600 bg-violet-50 min-w-24"
                >
                  Grade
                </th>
              </tr>

              <!-- Course Outcome Description Header -->
              <tr class="bg-indigo-50/40 border-b border-slate-200">
                <th
                  class="sticky left-0 z-30 bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                ></th>
                <th
                  class="sticky left-32 z-30 bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                ></th>
                <th
                  class="sticky left-80 z-10 bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                ></th>
                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-3 py-2 text-center text-[11px] text-slate-500 font-normal border-r border-slate-100 max-w-32"
                  >
                    <span class="line-clamp-2 block leading-tight">{{ co.co_description }}</span>
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold text-indigo-600 border-r border-slate-200 min-w-20"
                  >
                    Attainment
                  </th>
                </template>
                <th class="border-r border-slate-200 bg-violet-50/40"></th>
                <th class="bg-violet-50/40"></th>
              </tr>

              <!-- Weights/Max Scores Header -->
              <tr class="bg-slate-50 border-b border-slate-200">
                <th
                  class="sticky left-0 z-30 bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                ></th>
                <th
                  class="sticky left-32 z-30 bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                ></th>
                <th
                  class="sticky left-80 z-10 bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                ></th>
                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-3 py-2 text-center border-r border-slate-200"
                  >
                    <span class="block text-[11px] font-semibold text-slate-700">
                      ({{ co.co_weight }}%, Max: {{ co.co_score }})
                    </span>
                  </th>
                  <th class="border-r border-slate-200"></th>
                </template>
                <th class="border-r border-slate-200"></th>
                <th></th>
              </tr>
            </thead>

            <tbody class="bg-white divide-y divide-slate-100">
              <tr
                v-for="student in students"
                :key="student.id"
                class="group transition-colors duration-150"
                :class="
                  isBelowThreshold(student.id) ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
                "
              >
                <!-- Student No. -->
                <td
                  class="sticky left-0 z-20 px-4 py-3 font-semibold text-slate-900 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                  :class="
                    isBelowThreshold(student.id)
                      ? 'bg-red-50 group-hover:bg-red-100'
                      : 'bg-white group-hover:bg-slate-50'
                  "
                >
                  {{ student.id_number }}
                </td>
                <!-- Name -->
                <td
                  class="sticky left-32 z-10 px-4 py-3 text-slate-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap"
                  :class="
                    isBelowThreshold(student.id)
                      ? 'bg-red-50 group-hover:bg-red-100'
                      : 'bg-white group-hover:bg-slate-50'
                  "
                >
                  {{ student.name }}
                </td>
                <!-- Actions -->
                <td
                  class="sticky left-80 z-10 px-4 py-3 text-center border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                  :class="
                    isBelowThreshold(student.id)
                      ? 'bg-red-50 group-hover:bg-red-100'
                      : 'bg-white group-hover:bg-slate-50'
                  "
                >
                  <button
                    @click="openGradeModal(student)"
                    class="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    <PhPencilSimple :size="14" class="mr-1" />
                    Edit Grades
                  </button>
                </td>

                <!-- Dynamic CO columns -->
                <template v-for="coCode in coKeys" :key="coCode">
                  <td
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-2 py-3 text-center border-r border-slate-200"
                  >
                    <div class="w-16 text-center px-1 py-1 text-sm font-medium text-slate-800">
                      {{ getScore(student.id, co.id) !== '' ? getScore(student.id, co.id) : '—' }}
                    </div>
                    <div class="mt-1 text-[11px]">
                      <template v-if="getScore(student.id, co.id) !== ''">
                        <span
                          :class="[
                            'font-medium',
                            getScorePercentage(student.id, co) >= 60
                              ? 'text-emerald-600'
                              : 'text-rose-500',
                          ]"
                        >
                          {{ getScorePercentage(student.id, co) }}%
                        </span>
                      </template>
                      <span v-else class="text-slate-300">—</span>
                    </div>
                  </td>

                  <!-- Attainment -->
                  <td class="px-3 py-3 text-center border-r border-slate-200">
                    <template v-if="getCoAttainment(student.id, coCode) !== null">
                      <span
                        :class="[
                          'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                          getCoAttainment(student.id, coCode)! >= 60
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
                        ]"
                      >
                        {{ getCoAttainment(student.id, coCode) }}%
                      </span>
                    </template>
                    <span v-else class="text-slate-300 text-xs">—</span>
                  </td>
                </template>

                <!-- Final WA -->
                <td class="px-3 py-3 text-center border-r border-slate-200 bg-violet-50/30">
                  <template v-if="hasFinalWA(student.id)">
                    <span
                      :class="[
                        'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                        getFinalWA(student.id) >= 60
                          ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
                          : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
                      ]"
                    >
                      {{ getFinalWA(student.id) }}%
                    </span>
                  </template>
                  <span v-else class="text-slate-300 text-xs">—</span>
                </td>

                <!-- Grade -->
                <td class="px-3 py-3 text-center bg-violet-50/30">
                  <template v-if="hasFinalWA(student.id)">
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-sm font-bold text-slate-800">
                        {{ getGradeEquivalent(getFinalWA(student.id)).numerical.toFixed(2) }}
                      </span>
                      <span
                        :class="[
                          'text-xs font-semibold px-2 py-0.5 rounded-full ring-1',
                          getFinalWA(student.id) >= 60
                            ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                            : 'bg-rose-100 text-rose-700 ring-rose-200',
                        ]"
                      >
                        {{ getGradeEquivalent(getFinalWA(student.id)).letter }}
                      </span>
                    </div>
                  </template>
                  <span v-else class="text-slate-300 text-xs">—</span>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="students.length === 0">
                <td
                  :colspan="3 + courseOutcomes.length + coKeys.length + 2"
                  class="px-6 py-16 text-center"
                >
                  <div class="flex flex-col items-center justify-center text-slate-400">
                    <div
                      class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"
                    >
                      <i class="fas fa-user-graduate text-xl text-slate-400"></i>
                    </div>
                    <p class="text-sm font-medium text-slate-500">No students found.</p>
                    <p class="text-xs text-slate-400 mt-1">
                      Enroll students to start recording grades.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          :currentPage="currentPage"
          :totalItems="students.length"
          :itemsPerPage="itemsPerPage"
          :alwaysShow="true"
          @page-change="handlePageChange"
        />
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
      <GradeModal
        :isOpen="showGradeModal"
        :student="selectedStudentForGrade"
        :courseOutcomes="courseOutcomes"
        :existingScores="
          selectedStudentForGrade ? getExistingScoresForStudent(selectedStudentForGrade.id) : {}
        "
        :saving="savingGrade"
        :error="gradeModalError"
        @close="closeGradeModal"
        @submit="handleGradeSubmit"
      />
    </div>
  </AdminLayout>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>
