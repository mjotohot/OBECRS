<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { PhCheckCircle, PhWarningCircle, PhInfo, PhX } from '@phosphor-icons/vue'

const { toasts, removeToast } = useToast()

const iconMap = {
  success: PhCheckCircle,
  error: PhWarningCircle,
  info: PhInfo,
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col items-end space-y-3 pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      role="status"
      class="pointer-events-auto w-80 max-w-[90vw] bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden animate-slide-down"
    >
      <div class="flex items-start gap-3 px-4 py-3">
        <!-- Icon -->
        <component
          :is="iconMap[toast.type]"
          :size="20"
          weight="fill"
          class="shrink-0 mt-0.5"
          :class="{
            'text-emerald-500': toast.type === 'success',
            'text-rose-500': toast.type === 'error',
            'text-blue-500': toast.type === 'info',
          }"
        />
        <!-- Message -->
        <p class="flex-1 text-sm text-gray-800 font-medium leading-snug pr-1">
          {{ toast.message }}
        </p>
        <!-- Close button -->
        <button
          @click="removeToast(toast.id)"
          class="shrink-0 p-1 -mr-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Dismiss notification"
        >
          <PhX :size="14" weight="bold" />
        </button>
      </div>

      <!-- Progress bar -->
      <div class="h-0.5 w-full bg-gray-100">
        <div
          class="h-full rounded-full progress-bar"
          :class="{
            'bg-emerald-400': toast.type === 'success',
            'bg-rose-400': toast.type === 'error',
            'bg-blue-400': toast.type === 'info',
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-down {
  animation: slideDown 0.25s cubic-bezier(0.21, 1.02, 0.58, 1) forwards;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(2rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.progress-bar {
  animation: shrinkWidth 5s linear forwards;
}

@keyframes shrinkWidth {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
