<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PhUser :size="22" weight="bold" class="text-indigo-600" />
          Enroll Student to Course
        </h3>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
        >
          <PhX :size="20" weight="bold" />
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-5">
        <!-- Student Name (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
          <div
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium"
          >
            {{ student?.name || '—' }}
          </div>
        </div>

        <!-- Course Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Select Course <span class="text-red-500">*</span>
          </label>
          <select
            v-model="selectedCourseId"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white"
            required
          >
            <option :value="null">-- Select a course --</option>
            <option v-for="course in availableCourses" :key="course.id" :value="course.id">
              {{ course.course_code }} - {{ course.course_title }} ({{ course.section }})
            </option>
          </select>

          <!-- Loading indicator -->
          <p v-if="loadingCourses" class="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <PhSpinner :size="14" class="animate-spin" />
            Loading courses…
          </p>

          <!-- Empty state message -->
          <p
            v-if="!loadingCourses && availableCourses.length === 0"
            class="mt-2 text-sm text-yellow-600 flex items-center gap-1"
          >
            <PhWarningCircle :size="16" weight="bold" />
            No available courses. This student may already be enrolled in all courses or no courses
            exist.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
        <button
          type="button"
          @click="handleClose"
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleEnroll"
          :disabled="!selectedCourseId || loading"
          class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PhSpinner v-if="loading" :size="18" class="animate-spin" />
          {{ loading ? 'Enrolling…' : 'Enroll Student' }}
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
import { PhUser, PhX, PhSpinner, PhWarningCircle } from '@phosphor-icons/vue'

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
      academicYearStore.activeYear?.id,
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

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.student) {
      console.log('Modal opened for student:', props.student)
      loadAvailableCourses()
    }
  },
)
</script>
