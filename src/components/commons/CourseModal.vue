<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <component
            :is="mode === 'edit' ? PhPencil : PhPlusCircle"
            :size="22"
            weight="bold"
            class="text-indigo-600"
          />
          {{ mode === 'edit' ? 'Edit Course' : 'Add New Course' }}
        </h3>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
        >
          <PhX :size="20" weight="bold" />
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-5">
        <!-- Course Code -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Course Code <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.course_code"
            type="text"
            placeholder="e.g., CS 101"
            :disabled="mode === 'edit' && disableCodeEdit"
            :class="[
              'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400',
              formErrors.course_code
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300',
              mode === 'edit' && disableCodeEdit
                ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                : 'bg-white',
            ]"
            required
          />
          <p
            v-if="formErrors.course_code"
            class="mt-1.5 text-xs text-red-500 flex items-center gap-1"
          >
            <PhWarningCircle :size="14" weight="bold" />
            {{ formErrors.course_code }}
          </p>
        </div>

        <!-- Course Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Course Title <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.course_title"
            type="text"
            placeholder="e.g., Introduction to Computer Science"
            :class="[
              'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400',
              formErrors.course_title
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300',
            ]"
            required
          />
          <p
            v-if="formErrors.course_title"
            class="mt-1.5 text-xs text-red-500 flex items-center gap-1"
          >
            <PhWarningCircle :size="14" weight="bold" />
            {{ formErrors.course_title }}
          </p>
        </div>

        <!-- Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Section <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.section"
            type="text"
            placeholder="e.g., A, B, or 1, 2, 3"
            :class="[
              'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400',
              formErrors.section
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300',
            ]"
            required
          />
          <p v-if="formErrors.section" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <PhWarningCircle :size="14" weight="bold" />
            {{ formErrors.section }}
          </p>
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Academic Year <span class="text-red-500">*</span>
          </label>
          <select
            v-model="selectedAcademicYearId"
            @change="updateAcademicYearId"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white"
            :disabled="academicYearsLoading"
            required
          >
            <option :value="null">Select Academic Year</option>
            <option v-for="year in academicYears" :key="year.id" :value="year.id">
              {{ year.year }} - {{ year.semester }} {{ year.isActive ? '(Active)' : '' }}
            </option>
          </select>
          <p
            v-if="formErrors.academic_year"
            class="mt-1.5 text-xs text-red-500 flex items-center gap-1"
          >
            <PhWarningCircle :size="14" weight="bold" />
            {{ formErrors.academic_year }}
          </p>
          <p
            v-if="academicYearsLoading"
            class="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
          >
            <PhSpinner :size="14" class="animate-spin" />
            Loading academic years...
          </p>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5"> Status </label>
          <select
            v-model="formData.status"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="handleClose"
            class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            :class="[
              'px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2',
              mode === 'edit'
                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
            ]"
          >
            <PhSpinner v-if="loading" :size="18" class="animate-spin" />
            <template v-if="loading">
              {{ mode === 'edit' ? 'Updating...' : 'Adding...' }}
            </template>
            <template v-else>
              {{ mode === 'edit' ? 'Update Course' : 'Add Course' }}
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useAcademicYearStore } from '@/stores/academicYear'
import { storeToRefs } from 'pinia'
import { PhPencil, PhPlusCircle, PhX, PhSpinner, PhWarningCircle } from '@phosphor-icons/vue'

interface Props {
  isOpen: boolean
  mode?: 'add' | 'edit'
  course?: any
  loading?: boolean
  disableCodeEdit?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'add',
  course: null,
  loading: false,
  disableCodeEdit: true,
})

const emit = defineEmits<Emits>()

const academicYearStore = useAcademicYearStore()
const { allYears: academicYears, isLoading: academicYearsLoading } = storeToRefs(academicYearStore)

const selectedAcademicYearId = ref<number | null>(null)

const formData = reactive({
  course_code: '',
  course_title: '',
  section: '',
  academic_year: null as number | null,
  status: 'Not Started',
})

const formErrors = reactive({
  course_code: '',
  course_title: '',
  section: '',
  academic_year: '',
})

const updateAcademicYearId = () => {
  formData.academic_year = selectedAcademicYearId.value
}

const loadAcademicYears = async () => {
  if (academicYears.value.length === 0) {
    await academicYearStore.fetchAllYears()
  }
}

const resetForm = () => {
  if (props.mode === 'edit' && props.course) {
    formData.course_code = props.course.course_code || ''
    formData.course_title = props.course.course_title || ''
    formData.section = props.course.section || ''
    formData.academic_year = props.course.academic_year || null
    formData.status = props.course.status || 'Not Started'
    selectedAcademicYearId.value = formData.academic_year
  } else {
    formData.course_code = ''
    formData.course_title = ''
    formData.section = ''
    formData.academic_year = null
    formData.status = 'Not Started'
    selectedAcademicYearId.value = null
  }

  formErrors.course_code = ''
  formErrors.course_title = ''
  formErrors.section = ''
  formErrors.academic_year = ''
}

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      await loadAcademicYears()
      resetForm()
    }
  },
)

watch(
  () => props.course,
  () => {
    if (props.isOpen && props.mode === 'edit' && props.course) {
      resetForm()
    }
  },
  { deep: true },
)

const validateForm = (): boolean => {
  let isValid = true
  formErrors.course_code = ''
  formErrors.course_title = ''
  formErrors.section = ''
  formErrors.academic_year = ''

  if (!formData.course_code.trim()) {
    formErrors.course_code = 'Course code is required'
    isValid = false
  } else if (formData.course_code.length < 2) {
    formErrors.course_code = 'Course code must be at least 2 characters'
    isValid = false
  }

  if (!formData.course_title.trim()) {
    formErrors.course_title = 'Course title is required'
    isValid = false
  } else if (formData.course_title.length < 3) {
    formErrors.course_title = 'Course title must be at least 3 characters'
    isValid = false
  }

  if (!formData.section.trim()) {
    formErrors.section = 'Section is required'
    isValid = false
  }

  if (!formData.academic_year) {
    formErrors.academic_year = 'Please select an academic year'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (validateForm()) {
    formData.academic_year = selectedAcademicYearId.value
    emit('submit', { ...formData })
  }
}

const handleClose = () => {
  resetForm()
  emit('close')
}

onMounted(() => {
  loadAcademicYears()
})
</script>
