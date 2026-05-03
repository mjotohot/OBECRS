<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/auth.service'
import Pagination from '@/components/commons/Pagination.vue'
import {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setActiveAcademicYear,
} from '@/services/year.service'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import AppModal from '@/components/commons/AppModal.vue'
import AcademicYearModal from '@/components/commons/AcademicYearModal.vue'
import type { AcademicYear } from '@/types/academicTypes'
import {
  PhPlus,
  PhPencilSimple,
  PhTrash,
  PhCalendar,
  PhToggleRight,
} from '@phosphor-icons/vue'

const router = useRouter()
const showLogoutConfirm = ref(false)
const showAcademicYearModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedAcademicYear = ref<AcademicYear | null>(null)
const modalLoading = ref(false)
const academicYears = ref<AcademicYear[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)

const fetchAcademicYears = async () => {
  loading.value = true
  error.value = null
  currentPage.value = 1
  try {
    const response = await getAcademicYears()
    if (response.error) {
      error.value = response.error
      return
    }
    academicYears.value = response.data || []
  } catch (err) {
    console.error('Error fetching academic years:', err)
    error.value = 'Failed to load academic years'
  } finally {
    loading.value = false
  }
}

const paginatedAcademicYears = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return academicYears.value.slice(start, start + itemsPerPage.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const openAddModal = () => {
  modalMode.value = 'add'
  selectedAcademicYear.value = null
  showAcademicYearModal.value = true
}

const openEditModal = (academicYear: AcademicYear) => {
  modalMode.value = 'edit'
  selectedAcademicYear.value = academicYear
  showAcademicYearModal.value = true
}

const handleAcademicYearSubmit = async (formData: any) => {
  modalLoading.value = true
  try {
    if (modalMode.value === 'add') {
      const academicYearData = {
        year: formData.year.trim(),
        semester: formData.semester,
        is_active: formData.is_active,
      }
      const response = await createAcademicYear(academicYearData)
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        const newData = response.data
        academicYears.value.unshift(newData)
        if (formData.is_active === 'true') {
          academicYears.value = academicYears.value.map((ay) =>
            ay.id === newData.id ? ay : { ...ay, is_active: 'false' }
          )
        }
        showAcademicYearModal.value = false
      }
    } else {
      if (!selectedAcademicYear.value) return
      const updateData = {
        year: formData.year.trim(),
        semester: formData.semester,
        is_active: formData.is_active,
      }
      const response = await updateAcademicYear(selectedAcademicYear.value.id, updateData)
      if (response.error) {
        error.value = response.error
      } else if (response.data) {
        const updatedData = response.data
        const index = academicYears.value.findIndex((ay) => ay.id === updatedData.id)
        if (index !== -1) {
          academicYears.value[index] = updatedData
          if (formData.is_active === 'true') {
            academicYears.value = academicYears.value.map((ay) =>
              ay.id === updatedData.id ? ay : { ...ay, is_active: 'false' }
            )
          }
        }
        showAcademicYearModal.value = false
      }
    }
  } catch (err) {
    console.error('Error saving academic year:', err)
    error.value = 'Failed to save academic year'
  } finally {
    modalLoading.value = false
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

const handleDeleteAcademicYear = async (academicYear: AcademicYear) => {
  if (academicYear.is_active === 'true') {
    error.value =
      'Cannot delete the active academic year. Please set another academic year as active first.'
    return
  }
  if (confirm(`Are you sure you want to delete ${academicYear.year} - ${academicYear.semester}?`)) {
    try {
      const response = await deleteAcademicYear(academicYear.id)
      if (response.error) {
        error.value = response.error
        return
      }
      academicYears.value = academicYears.value.filter((ay) => ay.id !== academicYear.id)
    } catch (err) {
      console.error('Error deleting academic year:', err)
      error.value = 'Failed to delete academic year'
    }
  }
}

const handleToggleActive = async (academicYear: AcademicYear) => {
  if (academicYear.is_active === 'true') {
    error.value = 'Cannot deactivate the current academic year. Please activate another one first.'
    return
  }
  try {
    const response = await setActiveAcademicYear(academicYear.id)
    if (response.error) {
      error.value = response.error
      return
    }
    academicYears.value = academicYears.value.map((ay) => ({
      ...ay,
      is_active: ay.id === academicYear.id ? 'true' : 'false',
    }))
  } catch (err) {
    console.error('Error activating academic year:', err)
    error.value = 'Failed to activate academic year'
  }
}

onMounted(() => {
  fetchAcademicYears()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Academic Years
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Manage academic year records and set the active semester.
          </p>
        </div>

        <button
          @click="openAddModal"
          class="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PhPlus :size="16" weight="bold" class="mr-1.5" />
          Add Academic Year
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <div
          class="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"
        ></div>
        <p class="text-sm text-slate-400 font-medium">Loading academic years…</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4"
      >
        <PhTrash :size="22" weight="fill" class="text-red-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-red-800">Something went wrong</p>
          <p class="text-sm text-red-600 mt-0.5">{{ error }}</p>
          <button
            @click="fetchAcademicYears"
            class="mt-3 text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- Table Card -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <!-- Card Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Academic Year Records</h3>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ academicYears.length }} record{{ academicYears.length !== 1 ? 's' : '' }}
            </p>
          </div>
          <span
            class="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0"
          >
            {{ academicYears.length }} total
          </span>
        </div>

        <!-- Empty State -->
        <div v-if="academicYears.length === 0" class="p-16 text-center">
          <div
            class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <PhCalendar :size="32" class="text-slate-300" />
          </div>
          <p class="text-slate-500 font-medium">No academic years yet.</p>
          <p class="text-sm text-slate-400 mt-1">
            Click "Add Academic Year" to create the first one.
          </p>
        </div>

        <!-- Table + Pagination -->
        <template v-else>
          <table class="min-w-full">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-200">
                <th
                  class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Year
                </th>
                <th
                  class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Semester
                </th>
                <th
                  class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="academicYear in paginatedAcademicYears"
                :key="academicYear.id"
                class="hover:bg-slate-50/70 transition-colors group"
              >
                <!-- Year -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"
                    >
                      <PhCalendar :size="16" weight="bold" />
                    </div>
                    <span class="text-sm font-semibold text-slate-800">
                      {{ academicYear.year }}
                    </span>
                  </div>
                </td>

                <!-- Semester -->
                <td class="px-6 py-4 text-sm text-slate-500">
                  {{ academicYear.semester }}
                </td>

                <!-- Status Badge -->
                <td class="px-6 py-4">
                  <span
                    v-if="academicYear.is_active === 'true'"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    Active
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>
                    Inactive
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <!-- Set Active -->
                    <button
                      v-if="academicYear.is_active !== 'true'"
                      @click="handleToggleActive(academicYear)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Set as active"
                    >
                      <PhToggleRight :size="14" />
                      Set Active
                    </button>

                    <!-- Edit -->
                    <button
                      @click="openEditModal(academicYear)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <PhPencilSimple :size="14" />
                      Edit
                    </button>

                    <!-- Delete -->
                    <button
                      :disabled="academicYear.is_active === 'true'"
                      @click="handleDeleteAcademicYear(academicYear)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                      :class="
                        academicYear.is_active === 'true'
                          ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                          : 'text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100'
                      "
                    >
                      <PhTrash :size="14" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <Pagination
            :currentPage="currentPage"
            :totalItems="academicYears.length"
            :itemsPerPage="itemsPerPage"
            :alwaysShow="true"
            @page-change="handlePageChange"
          />
        </template>
      </div>

      <!-- Modals -->
      <AppModal
        :isOpen="showLogoutConfirm"
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        @confirm="handleLogoutConfirm"
        @cancel="showLogoutConfirm = false"
      />

      <AcademicYearModal
        :isOpen="showAcademicYearModal"
        :mode="modalMode"
        :academicYear="selectedAcademicYear"
        :loading="modalLoading"
        @close="showAcademicYearModal = false"
        @submit="handleAcademicYearSubmit"
      />
    </div>
  </AdminLayout>
</template>