<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 backdrop-blur-xs bg-black bg-opacity-50" @click="handleClose"></div>
    
    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          <i class="fas fa-upload mr-2"></i>
          Upload Syllabus - {{ course?.course_code }}: {{ course?.course_title }}
        </h3>
        <button 
          @click="handleClose"
          :disabled="uploading"
          class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600">
          Upload the course syllabus PDF. The system will automatically extract course outcomes from Part IV: Grading System.
        </p>
      </div>
      
      <div v-if="error" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
      
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select PDF File
        </label>
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
          :class="{ 'border-indigo-500 bg-indigo-50': isDragging }"
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
          <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-600">
            {{ selectedFile ? selectedFile.name : 'Drag & drop a PDF file here or click to browse' }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Only PDF files are accepted
          </p>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="handleClose"
          :disabled="uploading"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleUpload"
          :disabled="!selectedFile || uploading"
          :class="[
            'px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50',
            'bg-indigo-600 hover:bg-indigo-700'
          ]"
        >
          <i v-if="uploading" class="fas fa-spinner fa-pulse mr-2"></i>
          {{ uploading ? 'Processing...' : 'Upload & Extract COs' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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