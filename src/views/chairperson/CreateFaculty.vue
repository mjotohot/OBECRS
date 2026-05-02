<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import CreateFacultyModal from '@/components/commons/CreateFacultyModal.vue'
import AppModal from '@/components/commons/AppModal.vue'
import Pagination from '@/components/commons/Pagination.vue'
import { getFacultyUsers } from '@/services/auth.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/services/supabase.service'
import { PhPlus, PhUser, PhTrash } from '@phosphor-icons/vue'

interface FacultyUser {
  user_id: string
  first_name: string
  last_name: string
  email: string | null
  created_at: string | null
}

const router = useRouter()
const auth = useAuthStore()
const isChairperson = computed(() => auth.role === 'Chairperson')

const facultyUsers = ref<FacultyUser[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showCreateModal = ref(false)

const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteTarget = ref<FacultyUser | null>(null)
const deleteError = ref<string | null>(null)

// ---------- Pagination state ----------
const currentPage = ref(1)
const itemsPerPage = ref(10) // you can change the number

const paginatedFaculty = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return facultyUsers.value.slice(start, start + itemsPerPage.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}

// Optional: reset to page 1 whenever the list is refreshed
const fetchFacultyUsers = async () => {
  loading.value = true
  error.value = null
  currentPage.value = 1 // <-- reset pagination
  try {
    const { data, error: fetchError } = await getFacultyUsers()
    if (fetchError) throw new Error(fetchError)
    facultyUsers.value = data || []
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const confirmDelete = (user: FacultyUser) => {
  deleteTarget.value = user
  deleteError.value = null
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
  deleteError.value = null
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = null

  try {
    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-faculty`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: deleteTarget.value.user_id }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Delete request failed')
    }

    // Success – remove from local list and close modal
    facultyUsers.value = facultyUsers.value.filter((u) => u.user_id !== deleteTarget.value?.user_id)
    showDeleteModal.value = false
    deleteTarget.value = null
  } catch (err: any) {
    deleteError.value = err.message || 'Failed to delete faculty'
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(async () => {
  if (!isChairperson.value) {
    router.push('/')
    return
  }
  await fetchFacultyUsers()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Faculty Management
          </h2>
          <p class="mt-1 text-sm text-slate-500">Manage faculty accounts and create new ones.</p>
        </div>

        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PhPlus :size="16" weight="bold" class="mr-1.5" />
          Create Faculty
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <div
          class="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"
        ></div>
        <p class="text-sm text-slate-400 font-medium">Loading faculty…</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4"
      >
        <PhTrash :size="22" weight="fill" class="text-red-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-red-800">Failed to load</p>
          <p class="text-sm text-red-600 mt-0.5">{{ error }}</p>
          <button
            @click="fetchFacultyUsers"
            class="mt-3 text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- Faculty List -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Faculty Accounts</h3>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ facultyUsers.length }} faculty member{{ facultyUsers.length !== 1 ? 's' : '' }}
            </p>
          </div>
          <span
            class="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0"
          >
            {{ facultyUsers.length }} total
          </span>
        </div>

        <!-- Empty state -->
        <div v-if="facultyUsers.length === 0" class="p-16 text-center">
          <div
            class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <PhUser :size="32" class="text-slate-300" />
          </div>
          <p class="text-slate-500 font-medium">No faculty accounts yet.</p>
          <p class="text-sm text-slate-400 mt-1">Click "Create Faculty" to add the first one.</p>
        </div>

        <!-- Table + Pagination -->
        <template v-else>
          <table class="min-w-full">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-200">
                <th
                  class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Date Created
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
                v-for="user in paginatedFaculty"
                :key="user.user_id"
                class="hover:bg-slate-50/70 transition-colors group"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 uppercase"
                    >
                      {{ user.first_name?.charAt(0) }}{{ user.last_name?.charAt(0) }}
                    </div>
                    <div>
                      <div class="text-sm font-semibold text-slate-800 leading-tight">
                        {{ user.first_name }} {{ user.last_name }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-500">
                  {{ user.email ?? '—' }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-500">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="confirmDelete(user)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
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
            :totalItems="facultyUsers.length"
            :itemsPerPage="itemsPerPage"
            :alwaysShow="true"
            @page-change="handlePageChange"
          />
        </template>
      </div>

      <CreateFacultyModal
        :isOpen="showCreateModal"
        @close="showCreateModal = false"
        @success="((showCreateModal = false), fetchFacultyUsers())"
      />

      <AppModal
        :isOpen="showDeleteModal"
        title="Delete Faculty Account"
        :message="`Are you sure you want to delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This action cannot be undone.`"
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        variant="error"
        :loading="deleting"
        @confirm="handleDelete"
        @cancel="cancelDelete"
      />
    </div>
  </AdminLayout>
</template>
