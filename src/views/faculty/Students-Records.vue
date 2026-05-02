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
import { updateEnrollmentStatus } from '@/services/enrollment.service'
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
import { useAuthStore } from '@/stores/useAuthStore'
import { getGradesByEnrollments, bulkUpsertGrades } from '@/services/grades.service'
import { PhArrowLeft } from '@phosphor-icons/vue'

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
const authStore = useAuthStore()
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

// enrollment status map: studentId -> status
const enrollmentStatusMap = ref<Record<number, 'passed' | 'failed' | null>>({})
const updatingStatus = ref<number | null>(null)

// scores: studentId -> coId -> score value
const scores = ref<Record<number, Record<number, number>>>({})

// Group outcomes by co_code and sort by id
const groupedOutcomes = computed(() => {
  const groups: Record<string, CourseOutcome[]> = {}
  for (const co of courseOutcomes.value) {
    if (!groups[co.co_code]) groups[co.co_code] = []
    groups[co.co_code]?.push(co)
  }

  // Sort each group by id
  for (const coCode in groups) {
    groups[coCode]!.sort((a, b) => a.id - b.id)
  }

  return groups
})

// Sort CO keys alphabetically or by the first outcome's id in each group
const coKeys = computed(() => {
  const keys = Object.keys(groupedOutcomes.value)
  // Sort by the minimum id in each group to maintain order
  return keys.sort((a, b) => {
    const minIdA = Math.min(...(groupedOutcomes.value[a]?.map((co) => co.id) || [Infinity]))
    const minIdB = Math.min(...(groupedOutcomes.value[b]?.map((co) => co.id) || [Infinity]))
    return minIdA - minIdB
  })
})

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
    else {
      // Sort outcomes by id when fetching
      const outcomes = (outcomesRes.data as unknown as CourseOutcome[]) || []
      courseOutcomes.value = outcomes.sort((a, b) => a.id - b.id)
    }

    if (studentsRes.error) error.value = studentsRes.error
    else students.value = studentsRes.data || []

    if (enrollmentsRes.error) {
      error.value = enrollmentsRes.error
      return
    }

    if (enrollmentsRes.data) {
      enrollmentMap.value = {}
      enrollmentStatusMap.value = {}
      const enrollmentIds: number[] = []

      for (const enrollment of enrollmentsRes.data) {
        enrollmentMap.value[enrollment.student_id] = enrollment.id
        enrollmentStatusMap.value[enrollment.student_id] = enrollment.status || null
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

// Count how many COs are below 60%
const countCOsBelowThreshold = (studentId: number): number => {
  let belowCount = 0
  for (const coCode of coKeys.value) {
    const attainment = getCoAttainment(studentId, coCode)
    if (attainment !== null && attainment < 60) {
      belowCount++
    }
  }
  return belowCount
}

// Check if intervention is needed based on cases:
// Case 1: 1 CO < 60% -> intervention needed
// Case 2: 2 CO < 60% -> intervention needed
// Returns true if intervention is needed
const isInterventionNeeded = (studentId: number): boolean => {
  const belowCount = countCOsBelowThreshold(studentId)
  return belowCount >= 1 // Intervention needed if at least 1 CO is below 60%
}

// Get modified grade based on intervention rules
const getModifiedGrade = (studentId: number): { numerical: number; letter: string } => {
  const originalGrade = getGradeEquivalent(getFinalWA(studentId))
  const belowCount = countCOsBelowThreshold(studentId)
  
  // Case 2: 2 or more COs are below 60%, max grade is 3.0
  if (belowCount >= 2) {
    const originalNumerical = originalGrade.numerical
    if (originalNumerical < 3.0) {
      return { numerical: 3.0, letter: 'D' }
    }
  }
  
  // Case 1: 1 CO below 60%, grade remains as is
  return originalGrade
}

const isBelowThreshold = (studentId: number) => {
  return countCOsBelowThreshold(studentId) > 0
}

// Update enrollment status
const handleStatusChange = async (studentId: number, newStatus: 'passed' | 'failed' | null) => {
  const enrollmentId = enrollmentMap.value[studentId]
  if (!enrollmentId) {
    error.value = 'No enrollment found for this student'
    return
  }

  updatingStatus.value = studentId
  try {
    const result = await updateEnrollmentStatus(enrollmentId, newStatus)
    if (result.error) {
      error.value = result.error
    } else {
      enrollmentStatusMap.value[studentId] = newStatus
    }
  } catch (err) {
    console.error('Error updating status:', err)
    error.value = 'Failed to update status'
  } finally {
    updatingStatus.value = null
  }
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
    // If all students have grades, allow editing any student
    openGradeModal(students.value[0]!)
  } else {
    error.value = 'No students available'
  }
}

const facultyName = computed(() => {
  const u = authStore.user
  return u ? `${u.first_name} ${u.last_name}` : 'Faculty'
})

const deanName = ref('DR. JAYMER M. JAYOMA')

const semAy = computed(() => {
  if (!course?.academic_year) return '1ST SEMESTER / AY 2025 - 2026'
  // If you store semester, use it here; otherwise default to "1ST"
  const semester = '1ST'
  const startYear = course.academic_year - 1
  return `${semester} SEMESTER / AY ${startYear} - ${course.academic_year}`
})

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

    // Prepare grades for bulk upsert
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
      // Refresh data
      await fetchData()
      // Close modal
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

const openGradeModalForSelectedStudent = (event: Event) => {
  const select = event.target as HTMLSelectElement
  const studentId = Number(select.value)
  if (!studentId) return
  const student = students.value.find((s) => s.id === studentId)
  if (student) openGradeModal(student)
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
      abbreviation: co.co_description
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase())
        .join(''),
      maxScore: co.co_score,
      weight: co.co_weight,
      origId: co.id,
    })),
  }))

  // No normalisation – send exactly what the course has
  const weightPcts = coGroups.flatMap((co) =>
    co.assessments.map((a) => (a.weight > 0 ? `${a.weight}%` : '—')),
  )

  return {
    coGroups, // variable lengths per CO
    weightPcts,
  }
})

const pdfStudents = computed(() => {
  const tpl = pdfTemplate.value
  const allAssessments = tpl.coGroups.flatMap((g) => g.assessments)

  return students.value.map((student) => {
    // Raw scores in the same order as the padded assessment list
    const rawScores = allAssessments.map((assess) => {
      if (assess.origId === null) return 0 // padding – will be displayed as '—'
      const co = courseOutcomes.value.find((c) => c.id === assess.origId)
      return co ? parseFloat(String(getScore(student.id, co.id))) || 0 : 0
    })

    // Percentage equivalents
    const percentages = allAssessments.map((assess, i) => {
      if (assess.origId === null) return '—' // padding
      const score = rawScores[i]!
      return assess.maxScore ? ((score / assess.maxScore) * 100).toFixed(1) : '0.0'
    })

    // Summary values – use your existing helpers
    const coAttainments = coKeys.value.map((coCode) => getCoAttainment(student.id, coCode) ?? 0)
    const finalWA = getFinalWA(student.id)
    const grade = getGradeEquivalent(finalWA)
    const modifiedGrade = getModifiedGrade(student.id)
    const below = isBelowThreshold(student.id)
    const intervention = isInterventionNeeded(student.id) ? 'Yes' : 'No'

    return {
      id: student.id,
      name: student.name,
      rawScores,
      percentages,
      // Sum of weights for each CO (using padded list, but zeros don't affect sum)
      co1Weight: tpl.coGroups[0]?.assessments.reduce((s, a) => s + a.weight, 0) ?? 0,
      co2Weight: tpl.coGroups[1]?.assessments.reduce((s, a) => s + a.weight, 0) ?? 0,
      co3Weight: tpl.coGroups[2]?.assessments.reduce((s, a) => s + a.weight, 0) ?? 0,
      co1Percent: coAttainments[0],
      co2Percent: coAttainments[1],
      co3Percent: coAttainments[2],
      finalWA,
      finalGrade: grade.numerical.toFixed(2),
      remarks: below ? 'Failed' : 'Pass',
      intervention: intervention,
      finalGradeAfter: modifiedGrade.numerical.toFixed(2),
      status: enrollmentStatusMap.value[student.id] || '',
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
        title: `${course?.course_code} – ${course?.course_title}`,
        semAy: semAy.value,
      },
      signatories: {
        preparedBy: facultyName.value,
        approvedBy: deanName.value,
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
  } catch (err) {
    console.error('PDF export failed:', err)
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

const goBack = () => router.push('/faculty/courses')

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  fetchData()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <button
            @click="goBack"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors mb-3 group"
          >
            <PhArrowLeft :size="13" class="group-hover:-translate-x-0.5 transition-transform" />
            Back to Courses
          </button>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            My Class Record
          </h2>
          <p class="mt-1 text-gray-500" v-if="course">
            {{ course.course_code }} - {{ course.course_title }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Dropdown for students without grades -->
          <div class="relative" v-if="studentsWithoutGrades.length > 0">
            <select
              @change="openGradeModalForSelectedStudent"
              class="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="" disabled selected>Select student without grades</option>
              <option
                v-for="student in studentsWithoutGrades"
                :key="student.id"
                :value="student.id"
              >
                {{ student.id_number }} – {{ student.name }}
              </option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
            >
              <i class="fas fa-chevron-down text-xs"></i>
            </div>
          </div>

          <!-- Input Grade (opens modal for first student if no student was pre‑selected) -->
          <button
            @click="openGradeModalForStudentWithoutGrades"
            class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap"
          >
            <i class="fas fa-plus mr-2"></i>
            Input Grade
          </button>

          <!-- Export PDF -->
          <button
            @click="exportPDF"
            :disabled="isloading"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            <i class="fas fa-file-pdf mr-2"></i>
            {{ isloading ? 'Generating...' : 'Export to PDF' }}
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"
        ></div>
      </div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-700">{{ error }}</p>
        <button @click="fetchData" class="mt-2 text-sm text-red-600 hover:text-red-800 underline">
          Try Again
        </button>
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Student Scores</h3>
          <p class="text-sm text-gray-500 mt-0.5">
            Students with any CO attainment below 60% are highlighted in light red.
          </p>
        </div>

        <div class="overflow-x-auto max-w-full">
          <table class="min-w-max border-collapse text-sm">
            <thead>
              <!-- Row 1: CO Group Headers -->
              <tr class="bg-white border-b border-gray-200">
                <!-- Sticky: ID (left:0) -->
                <th
                  class="sticky left-0 z-[20] bg-white px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-28 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                >
                  Student No.
                </th>
                <!-- Sticky: Name (left = w-28 = 112px) -->
                <th
                  class="sticky z-[20] bg-white px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-44 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 112px"
                >
                  Name
                </th>
                <!-- Sticky: Actions (left = 112px + w-44 = 288px) -->
                <th
                  class="sticky z-[20] bg-white px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-24 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 288px"
                >
                  Actions
                </th>

                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    :colspan="(groupedOutcomes[coCode]?.length ?? 0) + 1"
                    class="px-4 py-3 text-center text-sm font-bold text-indigo-600 border-r border-gray-200 bg-indigo-50"
                  >
                    {{ coCode }}
                  </th>
                </template>
                <th
                  class="px-4 py-3 text-center text-sm font-bold text-purple-600 border-r border-gray-200 bg-purple-50 w-28"
                >
                  Final WA
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-bold text-purple-600 border-r border-gray-200 bg-purple-50 w-20"
                >
                  Grade
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-bold text-orange-600 border-r border-gray-200 bg-orange-50 w-24"
                >
                  Intervention
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-bold text-green-600 bg-green-50 w-28"
                >
                  Status
                </th>
              </tr>

              <!-- Row 2: Outcome descriptions -->
              <tr class="bg-indigo-50/40 border-b border-gray-200">
                <!-- Sticky cells (mirror offsets) -->
                <th
                  class="sticky left-0 z-[20] bg-white border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                ></th>
                <th
                  class="sticky z-[20] bg-white border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 112px"
                ></th>
                <th
                  class="sticky z-[20] bg-white border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 288px"
                ></th>

                <template v-for="coCode in coKeys" :key="coCode">
                  <th
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-3 py-2 text-center text-[11px] text-gray-500 font-normal border-r border-gray-100 max-w-[140px]"
                  >
                    <span class="line-clamp-2 block leading-tight">{{ co.co_description }}</span>
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold text-indigo-600 border-r border-gray-200 w-24"
                  >
                    Attainment
                  </th>
                </template>
                <th class="border-r border-gray-200 bg-purple-50/40"></th>
                <th class="border-r border-gray-200 bg-purple-50/40"></th>
                <th class="border-r border-gray-200 bg-orange-50/40"></th>
                <th class="bg-green-50/40"></th>
              </tr>

              <!-- Row 3: Weight / Max scores -->
              <tr class="bg-gray-50 border-b border-gray-200">
                <!-- Sticky cells -->
                <th
                  class="sticky left-0 z-[20] bg-gray-50 border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                ></th>
                <th
                  class="sticky z-[20] bg-gray-50 border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 112px"
                ></th>
                <th
                  class="sticky z-[20] bg-gray-50 border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 288px"
                ></th>

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
                <th class="border-r border-gray-200"></th>
                <th class="border-r border-gray-200"></th>
                <th class="border-r border-gray-200"></th>
                <th></th>
              </tr>
            </thead>

            <tbody class="bg-white divide-y divide-gray-100">
              <tr
                v-for="student in students"
                :key="student.id"
                :class="[
                  'group transition-colors duration-150',
                  isBelowThreshold(student.id)
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'bg-white hover:bg-gray-50',
                ]"
              >
                <!-- Sticky: ID -->
                <td
                  class="sticky left-0 z-[10] px-4 py-3 font-semibold text-gray-900 border-r border-gray-200 w-28 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                  :class="
                    isBelowThreshold(student.id)
                      ? 'bg-red-50 group-hover:bg-red-100'
                      : 'bg-white group-hover:bg-gray-50'
                  "
                >
                  {{ student.id_number }}
                </td>
                <!-- Sticky: Name -->
                <td
                  class="sticky z-[10] px-4 py-3 text-gray-800 border-r border-gray-200 w-44 whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 112px"
                  :class="
                    isBelowThreshold(student.id)
                      ? 'bg-red-50 group-hover:bg-red-100'
                      : 'bg-white group-hover:bg-gray-50'
                  "
                >
                  {{ student.name }}
                </td>
                <!-- Sticky: Actions -->
                <td
                  class="sticky z-[10] px-4 py-3 text-center border-r border-gray-200 w-24 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]"
                  style="left: 288px"
                  :class="
                    isBelowThreshold(student.id)
                      ? 'bg-red-50 group-hover:bg-red-100'
                      : 'bg-white group-hover:bg-gray-50'
                  "
                >
                  <button
                    @click="openGradeModal(student)"
                    class="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                    title="Edit grades"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                </td>

                <!-- Dynamic CO columns -->
                <template v-for="coCode in coKeys" :key="coCode">
                  <td
                    v-for="co in groupedOutcomes[coCode]"
                    :key="co.id"
                    class="px-2 py-3 text-center border-r border-gray-100"
                  >
                    <div class="w-16 mx-auto px-1 py-1 text-sm font-medium text-gray-800">
                      {{ getScore(student.id, co.id) !== '' ? getScore(student.id, co.id) : '—' }}
                    </div>
                    <div class="mt-1 text-[11px]">
                      <template v-if="getScore(student.id, co.id) !== ''">
                        <span
                          :class="[
                            'font-medium',
                            getScorePercentage(student.id, co) >= 60
                              ? 'text-green-600'
                              : 'text-red-500',
                          ]"
                        >
                          {{ getScorePercentage(student.id, co) }}%
                        </span>
                      </template>
                      <span v-else class="text-gray-300">—</span>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-center border-r border-gray-200">
                    <template v-if="getCoAttainment(student.id, coCode) !== null">
                      <span
                        :class="[
                          'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                          getCoAttainment(student.id, coCode)! >= 60
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700',
                        ]"
                      >
                        {{ getCoAttainment(student.id, coCode) }}%
                      </span>
                    </template>
                    <span v-else class="text-gray-300 text-xs">—</span>
                  </td>
                </template>

                <!-- Final WA -->
                <td class="px-3 py-3 text-center border-r border-gray-200 bg-purple-50/30 w-28">
                  <template v-if="hasFinalWA(student.id)">
                    <span
                      :class="[
                        'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                        getFinalWA(student.id) >= 60
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-red-100 text-red-700',
                      ]"
                    >
                      {{ getFinalWA(student.id) }}%
                    </span>
                  </template>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>

                <!-- Grade (Modified based on intervention rules) -->
                <td class="px-3 py-3 text-center border-r border-gray-200 bg-purple-50/30 w-20">
                  <template v-if="hasFinalWA(student.id)">
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-sm font-bold text-gray-800">
                        {{ getModifiedGrade(student.id).numerical }}
                      </span>
                      <span
                        :class="[
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          getModifiedGrade(student.id).numerical <= 3.0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700',
                        ]"
                      >
                        {{ getModifiedGrade(student.id).letter }}
                      </span>
                    </div>
                  </template>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>

                <!-- Intervention (Yes/No) -->
                <td class="px-3 py-3 text-center border-r border-gray-200 bg-orange-50/30 w-24">
                  <template v-if="hasFinalWA(student.id)">
                    <span
                      :class="[
                        'inline-block px-3 py-1 rounded-full text-xs font-semibold',
                        isInterventionNeeded(student.id)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700',
                      ]"
                    >
                      {{ isInterventionNeeded(student.id) ? 'Yes' : 'No' }}
                    </span>
                  </template>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>

                <!-- Status Dropdown -->
                <td class="px-3 py-3 text-center bg-green-50/30 w-28">
                  <template v-if="hasFinalWA(student.id)">
                    <select
                      :value="enrollmentStatusMap[student.id] || ''"
                      @change="handleStatusChange(student.id, ($event.target as HTMLSelectElement).value as 'passed' | 'failed' | null)"
                      :disabled="updatingStatus === student.id"
                      class="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Status</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <div v-if="updatingStatus === student.id" class="mt-1">
                      <div class="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-green-600 rounded-full"></div>
                    </div>
                  </template>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>
              </tr>

              <tr v-if="students.length === 0">
                <td
                  :colspan="3 + courseOutcomes.length + coKeys.length + 4"
                  class="px-6 py-16 text-center"
                >
                  <div class="flex flex-col items-center justify-center text-gray-400">
                    <div
                      class="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"
                    >
                      <i class="fas fa-user-graduate text-xl text-gray-400"></i>
                    </div>
                    <p class="text-sm font-medium text-gray-500">No students found.</p>
                    <p class="text-xs text-gray-400 mt-1">
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

/* Ensure sticky cells have a background so they don't become transparent */
.sticky {
  background-color: inherit;
}
</style>