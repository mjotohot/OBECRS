<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'error' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop (separate transition so its opacity doesn't affect the modal) -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9998] bg-black/50"
        @click="emit('cancel')"
      />
    </Transition>

    <!-- Modal box (separate transition, higher z-index, no shared parent opacity) -->
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none"
      >
        <div class="bg-base-100 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 pointer-events-auto">
          <h3 class="font-bold text-base mb-2">{{ title ?? 'Are you sure?' }}</h3>
          <p class="text-sm text-base-content/70">{{ message }}</p>

          <div class="flex justify-end gap-2 mt-6">
            <button class="btn btn-ghost btn-sm" @click="emit('cancel')">
              {{ cancelLabel ?? 'Cancel' }}
            </button>
            <button
              class="btn btn-sm text-white"
              :class="{
                'btn-error': variant === 'error' || !variant,
                'btn-warning': variant === 'warning',
                'btn-info': variant === 'info',
              }"
              @click="emit('confirm')"
            >
              {{ confirmLabel ?? 'Confirm' }}
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
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>