<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import { getCoursesByAdviser, createCourse, updateCourse, type Course } from '@/services/courses.service'
import { getCurrentUser } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'
import CourseModal from '@/components/commons/CourseModal.vue'
import CourseOutcomeModal from '@/components/commons/CourseOutcomeModal.vue'
import SyllabusUploadModal from '@/components/commons/SyllabusUploadModal.vue'
import { useCourseStore } from '@/stores/useCourseStore'
import { getCourseOutcomes, updateCourseOutcome, type CourseOutcome } from '@/services/course-outcome.service'
import { extractCOsFromPDF, insertCourseOutcomes, type ExtractedAssessment } from '@/services/gemini.service'

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

// CO Modal state
const selectedCourseForCO = ref<Course | null>(null)
const courseOutcomes = ref<CourseOutcome[]>([])
const coSaving = ref(false)
const coError = ref<string | null>(null)

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
        status: formData.status
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
        status: formData.status
      }
      
      const response = await updateCourse(selectedCourse.value.id, updateData)
      
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        const index = courses.value.findIndex(c => c.id === response.data?.id)
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
    // Step 1: Extract COs from PDF using Gemini
    const extractedData = await extractCOsFromPDF(file)
    
    if (!extractedData.assessments || extractedData.assessments.length === 0) {
      throw new Error('No assessments found in the syllabus')
    }
    
    // Step 2: Insert extracted assessments as course outcomes
    const result = await insertCourseOutcomes(
      selectedCourseForSyllabus.value.id,
      extractedData.assessments
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to insert course outcomes')
    }
    
    // Step 3: Update course status to 'In Progress'
    const updateData = {
 status: 'In Progress' as const
    }
    
    const response = await updateCourse(selectedCourseForSyllabus.value.id, updateData)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    // Step 4: Update local courses array with new status
    const index = courses.value.findIndex(c => c.id === selectedCourseForSyllabus.value?.id)
    if (index !== -1 && response.data) {
      courses.value[index] = response.data
    }
    
    // Close modal and show success
    showSyllabusModal.value = false
    alert(`Syllabus uploaded successfully! ${extractedData.assessments.length} course outcomes extracted.`)
    
  } catch (err) {
    console.error('Error uploading syllabus:', err)
    syllabusError.value = err instanceof Error ? err.message : 'Failed to process syllabus'
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
  router.push('/faculty/class-records')
}

const handleCOReport = (course: Course) => {
  console.log('Generate CO report for:', course.course_code)
}

// Determine which buttons to show based on status
const shouldShowUploadSyllabus = (status: string) => {
  return status === 'Not Started'
}

const shouldShowViewClassRecord = (status: string) => {
  return status !== 'Not Started'
}

const shouldShowCOReport = (status: string) => {
  return status !== 'Not Started'
}

// Lifecycle
onMounted(() => {
  fetchCourses()
})

// Get status badge styling
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

<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header Section with Add Button -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-900">My Active Courses</h2>
          <p class="mt-1 text-gray-500">
            Manage class records and track course outcome attainment for your courses
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <i class="fas fa-plus mr-2"></i>
          Add Course
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-700">{{ error }}</p>
        <button @click="fetchCourses" class="mt-2 text-sm text-red-600 hover:text-red-800">
          Try Again
        </button>
      </div>

      <!-- Courses Table -->
      <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Code
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Title
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CO Attainment Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">{{ course.course_code }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-900">{{ course.course_title }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{{ course.section }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusBadgeClass(course.status)]">
                    <i :class="[getStatusIcon(course.status), 'mr-1.5 text-xs']"></i>
                    {{ course.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-3">
                    <!-- Upload Syllabus button - only for 'Not Started' -->
                    <button 
                      v-if="shouldShowUploadSyllabus(course.status)" 
                      @click="openSyllabusModal(course)" 
                      class="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                    >
                      <i class="fas fa-upload mr-1"></i>
                      Upload Syllabus
                    </button>
                    
                    <!-- View Class Record button -->
                    <button 
                      v-if="shouldShowViewClassRecord(course.status)"
                      @click="handleViewClassRecord(course)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                    >
                      <i class="fas fa-book mr-1"></i>
                      View Class Record
                    </button>
                    
                    <!-- Edit CO Scores button -->
                    <button 
                      @click="openCOModal(course)" 
                      class="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                      title="Edit CO Scores"
                    >
                      <i class="fas fa-chart-line mr-1"></i>
                      Edit CO Scores
                    </button>
                    
                    <!-- CO Report button -->
                    <button 
                      v-if="shouldShowCOReport(course.status)"
                      @click="handleCOReport(course)" 
                      class="text-green-600 hover:text-green-900 transition-colors duration-200"
                    >
                      <i class="fas fa-file-alt mr-1"></i>
                      CO Report
                    </button>
                    
                    <!-- Edit course details button -->
                    <button
                      @click="openEditModal(course)"
                      class="text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
                      title="Edit Course"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="courses.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                  <i class="fas fa-book-open text-4xl mb-3 block"></i>
                  No courses found. Click "Add Course" to get started.
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
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

button:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>