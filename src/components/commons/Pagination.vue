<template>
  <div
    v-if="showPagination"
    class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100"
  >
    <!-- Item count info -->
    <p class="text-xs text-gray-500">
      Showing
      <span class="font-medium text-gray-700">{{ startIndex + 1 }}</span>
      –
      <span class="font-medium text-gray-700">{{ endIndex }}</span>
      of
      <span class="font-medium text-gray-700">{{ totalItems }}</span>
      results
    </p>

    <!-- Page controls -->
    <div class="flex items-center gap-1">
      <!-- Previous -->
      <button
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
        class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <PhCaretLeft :size="16" weight="bold" />
      </button>

      <!-- Page numbers (show max 5 with ellipsis) -->
      <template v-for="page in visiblePages" :key="page">
        <span
          v-if="page === '...'"
          class="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
        >
          ...
        </span>
        <button
          v-else
          @click="goToPage(page as number)"
          :class="[
            'inline-flex items-center justify-center w-15 h-9 rounded-lg text-xs font-medium transition-colors',
            currentPage === page ? 'text-gray-500' : 'text-gray-500',
          ]"
        >
          Page {{ page }}
        </button>
      </template>

      <!-- Next -->
      <button
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
        class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <PhCaretRight :size="16" weight="bold" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'

const props = defineProps<{
  currentPage: number
  totalItems: number
  itemsPerPage: number
  alwaysShow?: boolean // defaults to false if not passed
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage) || 1)

// Show if alwaysShow is true OR if there are multiple pages
const showPagination = computed(() => props.alwaysShow || totalPages.value > 1)

const startIndex = computed(() => (props.currentPage - 1) * props.itemsPerPage)
const endIndex = computed(() => Math.min(props.currentPage * props.itemsPerPage, props.totalItems))

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = props.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>
