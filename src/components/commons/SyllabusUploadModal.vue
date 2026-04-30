<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PhUpload :size="22" weight="bold" class="text-indigo-600" />
          Upload Syllabus – {{ course?.course_code }}: {{ course?.course_title }}
        </h3>
        <button
          @click="handleClose"
          :disabled="uploading"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhX :size="20" weight="bold" />
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-5">
        <!-- Description -->
        <p class="text-sm text-gray-600 leading-relaxed">
          Upload the course syllabus PDF. The system will automatically extract course outcomes from
          Part IV: Grading System.
        </p>

        <!-- Error Alert -->
        <div
          v-if="error"
          class="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2"
        >
          <PhWarningCircle :size="18" weight="bold" class="text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <!-- Drop Zone -->
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer"
          :class="
            isDragging
              ? 'border-indigo-400 bg-indigo-50/50'
              : selectedFile
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-gray-300 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/20'
          "
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".pdf"
            class="hidden"
            @change="handleFileSelect"
            :disabled="uploading"
          />

          <!-- Empty State -->
          <template v-if="!selectedFile">
            <div
              class="mx-auto h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3"
            >
              <PhCloudArrowUp :size="26" weight="bold" class="text-indigo-500" />
            </div>
            <p class="text-sm font-medium text-gray-700">Drag & drop a PDF file here</p>
            <p class="text-xs text-gray-500 mt-1">or click to browse</p>
            <p class="text-xs text-gray-400 mt-3">Only PDF files are accepted</p>
          </template>

          <!-- File Selected -->
          <template v-else>
            <div
              class="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3"
            >
              <PhFilePdf :size="26" weight="bold" class="text-emerald-600" />
            </div>
            <p class="text-sm font-medium text-gray-900 break-all">
              {{ selectedFile.name }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
            <button
              type="button"
              @click.stop="selectedFile = null"
              :disabled="uploading"
              class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              <PhTrash :size="14" weight="bold" />
              Remove file
            </button>
          </template>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
        <button
          type="button"
          @click="handleClose"
          :disabled="uploading"
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleUpload"
          :disabled="!selectedFile || uploading"
          class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PhSpinner v-if="uploading" :size="18" class="animate-spin" />
          {{ uploading ? 'Processing...' : 'Upload & Extract COs' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  PhUpload,
  PhX,
  PhWarningCircle,
  PhCloudArrowUp,
  PhFilePdf,
  PhTrash,
  PhSpinner,
} from '@phosphor-icons/vue'

interface Course {
  id: number
  course_code: string
  course_title: string
  section: string
  status: string
}

interface Props {
  isOpen: boolean
  course: Course | null
  uploading: boolean
  error?: string | null
}

interface Emits {
  (e: 'close'): void
  (e: 'upload', file: File): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)

const triggerFileInput = () => {
  if (!props.uploading) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.type === 'application/pdf') {
      selectedFile.value = file
    } else {
      alert('Please select a valid PDF file')
      selectedFile.value = null
    }
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    const file = files[0]
    if (file.type === 'application/pdf') {
      selectedFile.value = file
    } else {
      alert('Please select a valid PDF file')
      selectedFile.value = null
    }
  }
}

const handleUpload = () => {
  if (selectedFile.value) {
    emit('upload', selectedFile.value)
  }
}

const handleClose = () => {
  if (!props.uploading) {
    selectedFile.value = null
    emit('close')
  }
}
</script>
