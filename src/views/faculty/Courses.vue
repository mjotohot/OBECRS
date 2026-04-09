<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import { getCoursesByAdviser, updateCourseStatus, type Course } from '@/services/courses.service'
import { getCurrentUser } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'

const router = useRouter()
const showLogoutConfirm = ref(false)
const courses = ref<Course[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Fetch courses from Supabase
const fetchCourses = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Get current user first
    const userResponse = await getCurrentUser()
    
    if (userResponse.error || !userResponse.data) {
      error.value = 'Unable to load user information'
      loading.value = false
      return
    }
    
    // Fetch courses for this adviser
    const coursesResponse = await getCoursesByAdviser(parseInt(userResponse.data.id))
    
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

const handleLogoutConfirm = async () => {
  try {
    await signOut()
    router.push('/')
    console.log('Logout successful')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const handleViewClassRecord = (course: Course) => {
  console.log('View class record for:', course.course_code)
  // Navigate to class record page or open modal
  // router.push(`/courses/${course.id}/class-record`)
}

const handleUploadSyllabus = (course: Course) => {
  console.log('Upload syllabus for:', course.course_code)
  // Open file upload modal or navigate
}

const handleCOReport = (course: Course) => {
  console.log('Generate CO report for:', course.course_code)
  // Navigate to CO report page
  // router.push(`/courses/${course.id}/co-report`)
}

// Lifecycle
onMounted(() => {
  fetchCourses()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header Section -->
      <div>
        <h2 class="text-3xl font-bold text-gray-900">My Active Courses</h2>
        <p class="mt-1 text-gray-500">
          Manage class records and track course outcome attainment for your courses
        </p>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CO Attainment Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ course.course_code }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ course.course_title }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ course.section }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'bg-yellow-100 text-yellow-800': course.status === 'In Progress',
                    'bg-gray-100 text-gray-800': course.status === 'Not Started',
                    'bg-green-100 text-green-800': course.status === 'Completed'
                  }" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ course.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-3">
                    <button @click="handleViewClassRecord(course)" class="text-indigo-600 hover:text-indigo-900">
                      View Class Record
                    </button>
                    <button v-if="course.status === 'Not Started'" @click="handleUploadSyllabus(course)" class="text-indigo-600 hover:text-indigo-900">
                      Upload Syllabus
                    </button>
                    <button @click="handleCOReport(course)" class="text-indigo-600 hover:text-indigo-900">
                      CO Report
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
    </div>
  </AdminLayout>
</template>