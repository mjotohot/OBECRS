<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <component
            :is="mode === 'edit' ? PhPencilSimple : PhCalendarPlus"
            :size="22"
            weight="bold"
            class="text-indigo-600"
          />
          {{ mode === 'edit' ? 'Edit Academic Year' : 'Add New Academic Year' }}
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
        <!-- Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Academic Year <span class="text-red-500">*</span>
          </label>

          <input
            v-model="formData.year"
            type="text"
            placeholder="e.g., 2023-2024"
            :class="[
              'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
              formErrors.year
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500',
            ]"
            required
          />

          <p v-if="formErrors.year" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <PhWarningCircle :size="14" />
            {{ formErrors.year }}
          </p>
        </div>

        <!-- Semester -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Semester <span class="text-red-500">*</span>
          </label>

          <select
            v-model="formData.semester"
            :class="[
              'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
              formErrors.semester
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500',
            ]"
            required
          >
            <option value="">Select semester</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>

          <p v-if="formErrors.semester" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <PhWarningCircle :size="14" />
            {{ formErrors.semester }}
          </p>
        </div>

        <!-- Active -->
        <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="is_active"
            :checked="formData.is_active === 'true'"
            @change="handleCheckboxChange"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          />

          <label for="is_active" class="text-sm font-medium text-gray-700 cursor-pointer">
            Set as active academic year
          </label>
        </div>

        <p class="text-xs text-gray-500 -mt-2 ml-1">
          Only one academic year can be active at a time.
        </p>

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="handleClose"
            class="px-5 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            :disabled="loading"
            :class="[
              'px-5 py-2.5 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-50',
              mode === 'edit'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700',
            ]"
          >
            <PhSpinner v-if="loading" class="animate-spin" :size="18" />

            <span v-if="loading">
              {{ mode === 'edit' ? 'Updating...' : 'Adding...' }}
            </span>
            <span v-else>
              {{ mode === 'edit' ? 'Update Academic Year' : 'Add Academic Year' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import {
  PhCalendarPlus,
  PhPencilSimple,
  PhX,
  PhSpinner,
  PhWarningCircle,
} from '@phosphor-icons/vue'

interface Props {
  isOpen: boolean
  mode?: 'add' | 'edit'
  academicYear?: any
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: 'add',
  academicYear: null,
  loading: false,
})

const emit = defineEmits<Emits>()

// ✅ STRING-BASED STATE
const formData = reactive({
  year: '',
  semester: '',
  is_active: 'false' as 'true' | 'false',
})

const formErrors = reactive({
  year: '',
  semester: '',
})

// Reset
const resetForm = () => {
  if (props.mode === 'edit' && props.academicYear) {
    formData.year = props.academicYear.year || ''
    formData.semester = props.academicYear.semester || ''
    formData.is_active =
      props.academicYear.is_active === 'true' ? 'true' : 'false'
  } else {
    formData.year = ''
    formData.semester = ''
    formData.is_active = 'false'
  }

  formErrors.year = ''
  formErrors.semester = ''
}

// Watchers
watch(() => props.isOpen, (val) => val && resetForm())

watch(
  () => props.academicYear,
  () => {
    if (props.isOpen && props.mode === 'edit') resetForm()
  },
  { deep: true }
)

// Validate
const validateForm = () => {
  let valid = true

  formErrors.year = ''
  formErrors.semester = ''

  if (!formData.year.trim()) {
    formErrors.year = 'Academic year is required'
    valid = false
  } else if (!/^\d{4}-\d{4}$/.test(formData.year.trim())) {
    formErrors.year = 'Format should be YYYY-YYYY'
    valid = false
  }

  if (!formData.semester) {
    formErrors.semester = 'Semester is required'
    valid = false
  }

  return valid
}

// Submit
const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', { ...formData })
  }
}

// Close
const handleClose = () => {
  resetForm()
  emit('close')
}

// Checkbox handler
const handleCheckboxChange = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  formData.is_active = checked ? 'true' : 'false'
}
</script>