<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import { getStudentsByAdviser, createStudent, updateStudent } from '@/services/student.service'
import { getCurrentUser } from '@/services/auth.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'
import StudentModal from '@/components/commons/StudentModal.vue'
import type { Student } from '@/types/studentTypes'
import EnrollmentModal from '@/components/commons/EnrollmentModal.vue'


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
    } else {
      students.value = studentsResponse.data || []
    }
  } catch (err) {
    console.error('Error fetching students:', err)
    error.value = 'Failed to load students'
  } finally {
    loading.value = false
  }
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
        name: formData.name.trim()
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
        name: formData.name.trim()
      }
      
      const response = await updateStudent(selectedStudent.value.id, updateData)
      
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        const index = students.value.findIndex(s => s.id === response.data?.id)
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

// Lifecycle
onMounted(() => {
  fetchStudents()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header Section with Add Button -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-900">Students List</h2>
          <p class="mt-1 text-gray-500">
            Manage your students and enroll them to courses.
          </p>
        </div>
        <button
          @click="openAddModal"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <i class="fas fa-plus mr-2"></i>
          Add Student
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-700">{{ error }}</p>
        <button @click="fetchStudents" class="mt-2 text-sm text-red-600 hover:text-red-800">
          Try Again
        </button>
      </div>

      <!-- Students Table -->
      <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Number
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">{{ student.id_number }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-900">{{ student.name }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-3">
                    <button 
                      @click="openEnrollmentModal(student)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                    >
                      Enroll to Course
                    </button>
                    <button 
                      @click="openEditModal(student)"
                      class="text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button 
                      @click="handleDeleteStudent(student)"
                      class="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="students.length === 0">
                <td colspan="3" class="px-6 py-12 text-center text-gray-500">
                  <i class="fas fa-user-graduate text-4xl mb-3 block"></i>
                  No students found. Click "Add Student" to get started.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Logout Confirmation Modal -->
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

      <!-- Student Modal (Add/Edit) -->
      <StudentModal
        :isOpen="showStudentModal"
        :mode="modalMode"
        :student="selectedStudent"
        :loading="modalLoading"
        @close="showStudentModal = false"
        @submit="handleStudentSubmit"
      />

      <!-- Enrollment Modal -->
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