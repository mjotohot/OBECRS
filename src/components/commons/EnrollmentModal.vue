<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 backdrop-blur-xs bg-opacity-50" @click="handleClose"></div>
    
    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          <i class="fas fa-user-graduate mr-2"></i>
          Enroll Student to Course
        </h3>
        <button 
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Student: <span class="font-semibold">{{ student?.name }}</span>
        </label>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Select Course <span class="text-red-500">*</span>
        </label>
        <select
          v-model="selectedCourseId"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option :value="null">-- Select a course --</option>
          <option v-for="course in availableCourses" :key="course.id" :value="course.id">
            {{ course.course_code }} - {{ course.course_title }} ({{ course.section }})
          </option>
        </select>
        <p v-if="availableCourses.length === 0 && !loadingCourses" class="mt-2 text-sm text-yellow-600">
          No available courses found. This student may already be enrolled in all courses, or you have no courses created.
        </p>
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          @click="handleClose"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          @click="handleEnroll"
          :disabled="!selectedCourseId || loading"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <i v-if="loading" class="fas fa-spinner fa-pulse mr-2"></i>
          {{ loading ? 'Enrolling...' : 'Enroll Student' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { enrollStudent, getAvailableCoursesForStudent } from '@/services/enrollment.service'
import { useAcademicYearStore } from '@/stores/academicYear'
import { getCurrentUser } from '@/services/auth.service'

interface Props {
  isOpen: boolean
  student: any | null
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const loadingCourses = ref(false)
const selectedCourseId = ref<number | null>(null)
const availableCourses = ref<any[]>([])
const academicYearStore = useAcademicYearStore()
const currentUser = ref<any>(null)

const loadAvailableCourses = async () => {
  if (!props.student) {
    console.log('No student selected')
    return
  }
  
  loadingCourses.value = true
  
  try {
    // Get current logged in user (adviser)
    const userResponse = await getCurrentUser()
    console.log('Current user response:', userResponse)
    
    if (userResponse.error || !userResponse.data) {
      console.error('Unable to get current user:', userResponse.error)
      return
    }
    
    currentUser.value = userResponse.data
    const adviserId = +currentUser.value.id
    console.log('Adviser ID:', adviserId)
    
    await academicYearStore.fetchActiveYear()
    console.log('Active academic year:', academicYearStore.activeYear)
    
    const response = await getAvailableCoursesForStudent(
      props.student.id, 
      adviserId,
      academicYearStore.activeYear?.id
    )
    
    console.log('Available courses response:', response)
    
    if (!response.error) {
      availableCourses.value = response.data || []
      console.log('Available courses loaded:', availableCourses.value.length)
    } else {
      console.error('Error loading courses:', response.error)
    }
  } catch (err) {
    console.error('Failed to load available courses:', err)
  } finally {
    loadingCourses.value = false
  }
}

const handleEnroll = async () => {
  if (!selectedCourseId.value || !props.student) return
  
  loading.value = true
  const response = await enrollStudent(props.student.id, selectedCourseId.value)
  loading.value = false
  
  if (response.error) {
    alert(response.error)
  } else {
    alert('Student successfully enrolled!')
    emit('success')
    handleClose()
  }
}

const handleClose = () => {
  selectedCourseId.value = null
  availableCourses.value = []
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.student) {
    console.log('Modal opened for student:', props.student)
    loadAvailableCourses()
  }
})
</script>