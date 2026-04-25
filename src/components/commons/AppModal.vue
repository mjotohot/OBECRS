<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'error' | 'warning' | 'info'
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-9998 bg-black/40 backdrop-blur-sm"
        @click="emit('cancel')"
      />
    </Transition>

    <!-- Modal Dialog -->
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none p-4"
      >
        <div class="pointer-events-auto bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
          <!-- Title (optional icon based on variant) -->
          <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <i v-if="variant === 'error'" class="fas fa-exclamation-triangle text-red-500"></i>
            <i
              v-else-if="variant === 'warning'"
              class="fas fa-exclamation-circle text-amber-500"
            ></i>
            <i v-else-if="variant === 'info'" class="fas fa-info-circle text-blue-500"></i>
            {{ title ?? 'Are you sure?' }}
          </h3>

          <p class="text-sm text-gray-600">{{ message }}</p>

          <!-- Actions -->
          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              @click="emit('cancel')"
            >
              {{ cancelLabel ?? 'Cancel' }}
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
              :class="{
                'bg-red-600 hover:bg-red-700 focus:ring-red-500': variant === 'error' || !variant,
                'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500': variant === 'warning',
                'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500': variant === 'info',
              }"
              :disabled="loading"
              @click="emit('confirm')"
            >
              <span v-if="loading" class="inline-flex items-center gap-2">
                <span
                  class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                ></span>
                Processing…
              </span>
              <span v-else>{{ confirmLabel ?? 'Confirm' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
