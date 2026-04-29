<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import {
  getCoursesByAdviser,
  createCourse,
  updateCourse,
  type Course,
} from '@/services/courses.service'
import { getCurrentUser } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'
import CourseModal from '@/components/commons/CourseModal.vue'
import CourseOutcomeModal from '@/components/commons/CourseOutcomeModal.vue'
import SyllabusUploadModal from '@/components/commons/SyllabusUploadModal.vue'
import Pagination from '@/components/commons/Pagination.vue'
import { useCourseStore } from '@/stores/useCourseStore'
import {
  getCourseOutcomes,
  updateCourseOutcome,
  type CourseOutcome,
} from '@/services/course-outcome.service'
import {
  extractCOsFromPDF,
  insertCourseOutcomes,
  type ExtractedAssessment,
} from '@/services/gemini.service'
// Phosphor icons
import {
  PhPlus,
  PhUpload,
  PhBookOpen,
  PhChartLine,
  PhFileText,
  PhPencilSimple,
  PhClock,
  PhSpinner,
  PhCheckCircle,
  PhCircle,
} from '@phosphor-icons/vue'

const router = useRouter()
const store = useCourseStore()
const showLogoutConfirm = ref(false)
const showCourseModal = ref(false)
const showCOModal = ref(false)
const showSyllabusModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedCourse = ref<Course | null>(null)
const selectedCourseForSyllabus = ref<Course | null>(null)
const modalLoading = ref(false)
const courses = ref<Course[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentUser = ref<any>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)

// CO Modal state
const selectedCourseForCO = ref<Course | null>(null)
const courseOutcomes = ref<CourseOutcome[]>([])
const coSaving = ref(false)
const coError = ref<string | null>(null)

  const goBack = () => {
  router.push('/faculty/courses')
}
// Syllabus upload state
const syllabusUploading = ref(false)
const syllabusError = ref<string | null>(null)

// Fetch courses from Supabase
const fetchCourses = async () => {
  loading.value = true
  error.value = null

  try {
    const userResponse = await getCurrentUser()

    if (userResponse.error || !userResponse.data) {
      error.value = 'Unable to load user information'
      loading.value = false
      return
    }

    currentUser.value = userResponse.data
    const coursesResponse = await getCoursesByAdviser(+userResponse.data.id)

    if (coursesResponse.error) {
      error.value = coursesResponse.error
    } else {
      courses.value = coursesResponse.data || []
    }
  } catch (err) {
    console.error('Error fetching courses:', err)
    error.value = 'Failed to load courses'
  } finally {
    loading.value = false
  }
}

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return courses.value.slice(start, start + itemsPerPage.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}

// Open add course modal
const openAddModal = () => {
  modalMode.value = 'add'
  selectedCourse.value = null
  showCourseModal.value = true
}

// Open edit course modal
const openEditModal = (course: Course) => {
  modalMode.value = 'edit'
  selectedCourse.value = course
  showCourseModal.value = true
}

// Handle course form submission
const handleCourseSubmit = async (formData: any) => {
  if (!currentUser.value) {
    error.value = 'User not authenticated'
    return
  }

  modalLoading.value = true

  try {
    if (modalMode.value === 'add') {
      const courseData = {
        adviser_id: currentUser.value.id,
        course_code: formData.course_code.toUpperCase().trim(),
        course_title: formData.course_title.trim(),
        section: formData.section.trim().toUpperCase(),
        academic_year: formData.academic_year,
        status: formData.status,
      }

      const response = await createCourse(courseData, currentUser.value.id)

      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        courses.value.unshift(response.data)
        showCourseModal.value = false
        console.log('Course added successfully')
      }
    } else {
      if (!selectedCourse.value) return

      const updateData = {
        course_title: formData.course_title.trim(),
        section: formData.section.trim().toUpperCase(),
        academic_year_id: formData.academic_year_id,
        status: formData.status,
      }

      const response = await updateCourse(selectedCourse.value.id, updateData)

      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        const index = courses.value.findIndex((c) => c.id === response.data?.id)
        if (index !== -1) {
          courses.value[index] = response.data
        }
        showCourseModal.value = false
        console.log('Course updated successfully')
      }
    }
  } catch (err) {
    console.error('Error saving course:', err)
    error.value = 'Failed to save course'
  } finally {
    modalLoading.value = false
  }
}

// Open Syllabus Upload Modal
const openSyllabusModal = (course: Course) => {
  selectedCourseForSyllabus.value = course
  syllabusError.value = null
  showSyllabusModal.value = true
}

// Handle Syllabus Upload and Extraction
const handleSyllabusUpload = async (file: File) => {
  if (!selectedCourseForSyllabus.value) return

  syllabusUploading.value = true
  syllabusError.value = null

  try {
    const extractedData = await extractCOsFromPDF(file)

    if (!extractedData.assessments || extractedData.assessments.length === 0) {
      throw new Error('No assessments found in the syllabus')
    }

    const result = await insertCourseOutcomes(
      selectedCourseForSyllabus.value.id,
      extractedData.assessments,
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to insert course outcomes')
    }

    const updateData = {
      status: 'In Progress' as const,
    }

    const response = await updateCourse(selectedCourseForSyllabus.value.id, updateData)

    if (response.error) {
      throw new Error(response.error)
    }

    const index = courses.value.findIndex((c) => c.id === selectedCourseForSyllabus.value?.id)
    if (index !== -1 && response.data) {
      courses.value[index] = response.data
    }

    showSyllabusModal.value = false
    // Clear selected file and show success message
    alert(
      `Syllabus uploaded successfully! ${extractedData.assessments.length} course outcomes extracted.`,
    )
  } catch (err) {
    console.error('Error uploading syllabus:', err)
    
    // Custom error message for missing assessments
    if (err instanceof Error && err.message.includes('missing assessment tasks')) {
      syllabusError.value = 'The syllabus is missing complete assessment task information. Please ensure the syllabus contains a detailed "Assessment Weights" table with all required tasks and their weights before uploading.'
    } else {
      syllabusError.value = err instanceof Error ? err.message : 'Failed to process syllabus'
    }
  } finally {
    syllabusUploading.value = false
  }
}

// Open Course Outcomes modal to EDIT CO SCORES
const openCOModal = async (course: Course) => {
  selectedCourseForCO.value = course
  coError.value = null
  coSaving.value = false

  try {
    const response = await getCourseOutcomes(course.id)

    if (response.error) {
      coError.value = response.error
    } else {
      courseOutcomes.value = response.data || []
      showCOModal.value = true
    }
  } catch (err) {
    console.error('Error fetching course outcomes:', err)
    coError.value = 'Failed to load course outcomes'
  }
}

// Handle saving edited CO SCORES
const handleSaveOutcomeScores = async (updatedOutcomes: CourseOutcome[]) => {
  coSaving.value = true
  coError.value = null

  try {
    for (const outcome of updatedOutcomes) {
      const response = await updateCourseOutcome(outcome.id, { co_score: outcome.co_score })
      if (response.error) {
        throw new Error(`Failed to update outcome ${outcome.id}`)
      }
    }

    courseOutcomes.value = updatedOutcomes
    showCOModal.value = false
    console.log('CO scores saved successfully')
  } catch (err) {
    console.error('Error saving course outcomes:', err)
    coError.value = 'Failed to save course outcomes'
  } finally {
    coSaving.value = false
  }
}

const handleLogoutConfirm = async () => {
  try {
    await signOut()
    router.push('/')
    console.log('Logout successful')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Action handlers
const handleViewClassRecord = (course: Course) => {
  store.setCourse(course)
  router.push({
    name: 'ChairpersonClassRecord',
    params: { courseId: course.id },
  })
}

const handleCOReport = (course: Course) => {
  store.setCourse(course)
  router.push({
    name: 'ChairpersonDashboardClassRecord',
    params: { courseId: course.id },
  })
}

// Determine which buttons to show based on status
const shouldShowUploadSyllabus = (status: string) => status === 'Not Started'
const shouldShowEditCO = (status: string) => status === 'In Progress' || status === 'Completed'
const shouldShowViewClassRecord = (status: string) => status !== 'Not Started'
const shouldShowCOReport = (status: string) => status !== 'Not Started'

// Lifecycle
onMounted(() => {
  fetchCourses()
})

// Status badge classes (with ring)
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

// Row left border color helper
const getStatusBorderClass = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'border-l-amber-400'
    case 'Completed':
      return 'border-l-emerald-400'
    default:
      return 'border-l-gray-300'
  }
}
</script>

<template>
  <AdminLayout>
    <div class="space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            My Active Courses
          </h2>
          <p class="mt-2 text-base text-gray-500 max-w-2xl">
            Manage class records and track course outcome attainment for your courses
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 whitespace-nowrap"
        >
          <PhPlus :size="18" weight="bold" />
          Add Course
        </button>
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
          @click="fetchCourses"
          class="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
        >
          Try Again
        </button>
      </div>

      <!-- Courses Table -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead>
              <tr class="bg-linear-to-b from-gray-50 to-gray-100/50">
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Course Code
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Course Title
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Section
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  CO Attainment Status
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="course in paginatedCourses"
                :key="course.id"
                :class="[
                  'group border-l-4 transition-all duration-150',
                  getStatusBorderClass(course.status),
                  'hover:bg-gray-50/80',
                ]"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-bold text-gray-900 tracking-tight">
                    {{ course.course_code }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-700">{{ course.course_title }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-700">{{ course.section }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium leading-5',
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
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex items-center flex-wrap gap-1">
                    <!-- Upload Syllabus -->
                    <button
                      v-if="shouldShowUploadSyllabus(course.status)"
                      @click="openSyllabusModal(course)"
                      class="inline-flex items-center cursor-pointer gap-1.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <PhUpload :size="14" weight="bold" />
                      Upload Syllabus
                    </button>

                    <!-- View Class Record -->
                    <button
                      v-if="shouldShowViewClassRecord(course.status)"
                      @click="handleViewClassRecord(course)"
                      class="inline-flex items-center gap-1.5 cursor-pointer px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <PhBookOpen :size="14" weight="bold" />
                      View Class Record
                    </button>

                    <!-- Edit CO Scores -->
                    <button
                       v-if="shouldShowViewClassRecord(course.status)"
                      @click="openCOModal(course)"
                      class="inline-flex items-center gap-1.5 px-3 cursor-pointer py-2 text-xs font-medium rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit CO Scores"
                    >
                      <PhChartLine :size="14" weight="bold" />
                      Edit CO Scores
                    </button>

                    <!-- CO Report -->
                    <button
                      v-if="shouldShowCOReport(course.status)"
                      @click="handleCOReport(course)"
                      class="inline-flex items-center gap-1.5 px-3 cursor-pointer py-2 text-xs font-medium rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <PhFileText :size="14" weight="bold" />
                      CO Report
                    </button>

                    <!-- Edit Course -->
                    <button
                      @click="openEditModal(course)"
                      class="inline-flex items-center gap-1.5 px-3 cursor-pointer py-2 text-xs font-medium rounded-lg hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                      title="Edit Course"
                    >
                      <PhPencilSimple :size="14" weight="bold" />
                      Edit Course
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="courses.length === 0">
                <td colspan="5" class="px-6 py-20">
                  <div class="flex flex-col items-center justify-center text-center">
                    <div
                      class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"
                    >
                      <PhBookOpen :size="28" weight="bold" class="text-gray-400" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">No courses yet</h3>
                    <p class="mt-1 text-sm text-gray-500">
                      Get started by adding your first course.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          :currentPage="currentPage"
          :totalItems="courses.length"
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

      <CourseModal
        :isOpen="showCourseModal"
        :mode="modalMode"
        :course="selectedCourse"
        :loading="modalLoading"
        :disableCodeEdit="true"
        @close="showCourseModal = false"
        @submit="handleCourseSubmit"
      />

      <CourseOutcomeModal
        :isOpen="showCOModal"
        :course="selectedCourseForCO"
        :courseOutcomes="courseOutcomes"
        :saving="coSaving"
        :error="coError"
        @close="showCOModal = false"
        @save="handleSaveOutcomeScores"
      />

      <SyllabusUploadModal
        :isOpen="showSyllabusModal"
        :course="selectedCourseForSyllabus"
        :uploading="syllabusUploading"
        :error="syllabusError"
        @close="showSyllabusModal = false"
        @upload="handleSyllabusUpload"
      />
    </div>
  </AdminLayout>
</template>

<style scoped>
button:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}
</style>