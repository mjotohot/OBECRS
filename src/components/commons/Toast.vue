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
  <div class="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      role="status"
      class="pointer-events-auto w-80 max-w-[90vw] backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl overflow-hidden"
    >
      <div class="flex items-start gap-3 p-3">
        <component
          :is="iconMap[toast.type]"
          :size="20"
          weight="fill"
          class="shrink-0 mt-0.5"
          :class="{
            'text-emerald-400': toast.type === 'success',
            'text-rose-400': toast.type === 'error',
            'text-blue-400': toast.type === 'info',
          }"
        />
        <div class="flex-1 text-sm text-white font-medium leading-tight">
          {{ toast.message }}
        </div>
        <button
          @click="removeToast(toast.id)"
          class="shrink-0 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss notification"
        >
          <PhX :size="16" weight="bold" />
        </button>
      </div>

      <!-- Progress bar container -->
      <div class="h-1 w-full bg-white/10">
        <div
          class="progress-bar h-full"
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
  animation: slideDown 0.2s ease-out forwards;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
