<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import Pagination from '@/components/commons/Pagination.vue'
import {
  getStudentsByAdviser,
  createStudent,
  updateStudent,
  getEnrolledCoursesByStudentIds,
} from '@/services/student.service'
import { getCurrentUser } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'
import StudentModal from '@/components/commons/StudentModal.vue'
import type { Student } from '@/types/studentTypes'
import EnrollmentModal from '@/components/commons/EnrollmentModal.vue'
import {
  PhPlus,
  PhBookOpen,
  PhPencilSimple,
  PhTrash,
  PhStudent,
  PhCheckCircle,
  PhXCircle,
} from '@phosphor-icons/vue'

const router = useRouter()
const showLogoutConfirm = ref(false)
const showStudentModal = ref(false)
const showEnrollmentModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedStudent = ref<Student | null>(null)
const modalLoading = ref(false)
const students = ref<Student[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentUser = ref<any>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Fetch students from Supabase
const fetchStudents = async () => {
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
    const studentsResponse = await getStudentsByAdviser(+userResponse.data.id)

    if (studentsResponse.error) {
      error.value = studentsResponse.error
      return
    }

    const studentsData: Student[] = studentsResponse.data || []
    const studentIds = studentsData.map((s) => s.id)
    const coursesByStudent = await getEnrolledCoursesByStudentIds(studentIds)

    for (const student of studentsData) {
      student.enrolledCourses = coursesByStudent[student.id] || []
    }

    students.value = studentsData
  } catch (err) {
    console.error('Error fetching students:', err)
    error.value = 'Failed to load students'
  } finally {
    loading.value = false
  }
}

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return students.value.slice(start, start + itemsPerPage.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}

// Open add student modal
const openAddModal = () => {
  modalMode.value = 'add'
  selectedStudent.value = null
  showStudentModal.value = true
}

// Open enrollment modal with selected student
const openEnrollmentModal = (student: Student) => {
  selectedStudent.value = student
  showEnrollmentModal.value = true
}

// Close enrollment modal
const closeEnrollmentModal = () => {
  showEnrollmentModal.value = false
  selectedStudent.value = null
}

// Handle successful enrollment
const handleEnrollmentSuccess = () => {
  closeEnrollmentModal()
  // Optionally refresh student data or show success message
  console.log('Enrollment successful')
}

// Open edit student modal
const openEditModal = (student: Student) => {
  modalMode.value = 'edit'
  selectedStudent.value = student
  showStudentModal.value = true
}

// Handle student form submission
const handleStudentSubmit = async (formData: any) => {
  if (!currentUser.value) {
    error.value = 'User not authenticated'
    return
  }

  modalLoading.value = true

  try {
    if (modalMode.value === 'add') {
      // Add new student
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
        console.log('Student added successfully')
      }
    } else {
      // Edit existing student
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
        if (index !== -1) {
          students.value[index] = response.data
        }
        showStudentModal.value = false
        console.log('Student updated successfully')
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
    console.log('Logout successful')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Delete student
const handleDeleteStudent = async (student: Student) => {
  if (confirm(`Are you sure you want to delete ${student.name}?`)) {
    // Add your delete logic here
    console.log('Delete student:', student)
  }
}

const getStatusBorderClass = (status?: string) => {
  switch (status) {
    case 'Active':
      return 'border-l-emerald-400'
    case 'Inactive':
      return 'border-l-gray-300'
    default:
      return 'border-l-gray-300'
  }
}

// Lifecycle
onMounted(() => {
  fetchStudents()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Students List</h2>
          <p class="mt-2 text-base text-gray-500 max-w-2xl">
            Manage your students and enroll them to courses.
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 whitespace-nowrap"
        >
          <PhPlus :size="18" weight="bold" />
          Add Student
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
          @click="fetchStudents"
          class="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
        >
          Try Again
        </button>
      </div>

      <!-- Students Table -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead>
              <tr class="bg-linear-to-b from-gray-50 to-gray-100/50">
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  ID Number
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Enrolled Courses
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Date Added
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Status
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
                v-for="student in paginatedStudents"
                :key="student.id"
                :class="[
                  'group border-l-4 transition-all duration-150',
                  getStatusBorderClass(student.status),
                  'hover:bg-gray-50/80',
                ]"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-bold text-gray-900 tracking-tight">{{
                    student.id_number
                  }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-700">{{ student.name }}</span>
                </td>
                <!-- Enrolled Courses -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="student.enrolledCourses?.length" class="flex flex-wrap gap-1">
                    <span
                      v-for="(course, i) in student.enrolledCourses"
                      :key="i"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#003300]/80 text-white ring-1 ring-inset ring-blue-600/20"
                    >
                      {{ course.course_code }}
                    </span>
                  </div>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <!-- Date Added -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span v-if="student.created_at" class="text-sm text-gray-600">
                    {{
                      new Date(student.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    }}
                  </span>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                      student.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                        : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20',
                    ]"
                  >
                    <component
                      :is="student.status === 'Active' ? PhCheckCircle : PhXCircle"
                      :size="12"
                      weight="bold"
                    />
                    {{ student.status || 'Inactive' }}
                  </span>
                </td>
                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex items-center gap-1.5">
                    <button
                      @click="openEnrollmentModal(student)"
                      class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <PhBookOpen :size="14" weight="bold" />
                      Enroll
                    </button>
                    <button
                      @click="openEditModal(student)"
                      class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <PhPencilSimple :size="14" weight="bold" />
                      Edit
                    </button>
                    <button
                      @click="handleDeleteStudent(student)"
                      class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <PhTrash :size="14" weight="bold" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="students.length === 0">
                <td colspan="6" class="px-6 py-20">
                  <div class="flex flex-col items-center justify-center text-center">
                    <div
                      class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"
                    >
                      <PhStudent :size="28" weight="bold" class="text-gray-400" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">No students yet</h3>
                    <p class="mt-1 text-sm text-gray-500">
                      Get started by adding your first student.
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
    </div>
  </AdminLayout>
</template>
