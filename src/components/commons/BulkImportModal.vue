<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PhUploadSimple :size="22" weight="bold" class="text-indigo-600" />
          Bulk Import Students
        </h3>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          :disabled="isProcessing"
        >
          <PhX :size="20" weight="bold" />
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-5">
        <!-- Instructions -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-blue-900 mb-2">Instructions:</h4>
          <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>File must be in CSV format</li>
            <li>Required columns: ID Number, Name (in that order)</li>
            <li>Maximum 500 students per import</li>
            <li>ID Number must be unique per student</li>
          </ul>
          <button
            @click="downloadTemplate"
            class="mt-3 text-sm text-blue-700 hover:text-blue-900 font-medium underline underline-offset-2"
            type="button"
          >
            Download CSV Template
          </button>
        </div>

        <!-- File Upload Area -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Choose CSV File
          </label>
          
          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            accept=".csv,.txt"
            class="hidden"
            :disabled="isProcessing"
            @change="handleFileSelect"
          />

          <!-- Upload box -->
          <div
            :class="[
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50',
              isProcessing && 'opacity-50 cursor-not-allowed'
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <PhUploadSimple :size="40" class="mx-auto text-gray-400 mb-3" />
            <p class="text-sm text-gray-600">
              <span class="font-medium text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500 mt-1">CSV files only</p>
          </div>

          <!-- Selected file info -->
          <div v-if="selectedFileName" class="mt-2 flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <PhFileCsv :size="20" class="text-green-600" />
              <span class="text-sm text-gray-700">{{ selectedFileName }}</span>
            </div>
            <button
              @click="clearFile"
              class="text-red-500 hover:text-red-700 transition-colors"
              :disabled="isProcessing"
            >
              <PhTrash :size="16" />
            </button>
          </div>
        </div>

        <!-- Preview Section -->
        <div v-if="studentsToImport.length > 0 || errors.length > 0" class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-900">Preview</h4>
            <span class="text-xs text-gray-500">
              {{ studentsToImport.length }} student(s) ready to import
            </span>
          </div>

          <!-- Error List -->
          <div v-if="errors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
            <div class="flex items-start gap-2">
              <PhWarningCircle :size="16" class="text-red-600 mt-0.5" weight="fill" />
              <div class="flex-1">
                <p class="text-sm font-medium text-red-800 mb-1">{{ errors.length }} error(s) found:</p>
                <ul class="text-xs text-red-700 space-y-0.5 list-disc list-inside">
                  <li v-for="(error, idx) in errors.slice(0, 5)" :key="idx">{{ error }}</li>
                  <li v-if="errors.length > 5" class="text-red-600">
                    ... and {{ errors.length - 5 }} more
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Students Table Preview -->
          <div v-if="studentsToImport.length > 0" class="border rounded-lg overflow-hidden">
            <div class="max-h-48 overflow-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Number</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr v-for="(student, idx) in studentsToImport.slice(0, 10)" :key="idx">
                    <td class="px-4 py-2 text-sm text-gray-900">{{ student.id_number }}</td>
                    <td class="px-4 py-2 text-sm text-gray-700">{{ student.name }}</td>
                  </tr>
                  <tr v-if="studentsToImport.length > 10">
                    <td colspan="2" class="px-4 py-2 text-sm text-gray-500 text-center">
                      ... and {{ studentsToImport.length - 10 }} more
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Import Progress -->
        <div v-if="isProcessing" class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">Importing students...</span>
            <span class="text-gray-500">{{ importedCount }}/{{ studentsToImport.length }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(importedCount / studentsToImport.length) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
        <button
          v-if="!isProcessing"
          type="button"
          @click="handleClose"
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          v-if="!isProcessing"
          @click="handleImport"
          :disabled="studentsToImport.length === 0"
          :class="[
            'px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors',
            'disabled:opacity-50 flex items-center gap-2',
            studentsToImport.length > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              : 'bg-gray-300 cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-offset-2'
          ]"
        >
          Import Students
        </button>
        <button
          v-if="isProcessing"
          disabled
          class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-400 rounded-lg cursor-not-allowed flex items-center gap-2"
        >
          <PhSpinner :size="18" class="animate-spin" />
          Importing...
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  PhX, 
  PhUploadSimple, 
  PhWarningCircle, 
  PhFileCsv, 
  PhTrash,
  PhSpinner 
} from '@phosphor-icons/vue'
import { parseStudentsCSV, downloadCSVTemplate, type ParsedStudent } from '@/utils/csvParser'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  import: [students: ParsedStudent[]]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const studentsToImport = ref<ParsedStudent[]>([])
const errors = ref<string[]>([])
const isProcessing = ref(false)
const importedCount = ref(0)
const selectedFileName = ref<string>('')

const triggerFileInput = () => {
  if (!isProcessing.value && fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFileName.value = file.name
    processFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    selectedFileName.value = file.name
    processFile(file)
  } else if (file) {
    alert('Please upload a CSV file')
  }
}

const processFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const { students, errors: parseErrors } = parseStudentsCSV(content)
    
    // Check maximum limit
    if (students.length > 500) {
      errors.value = [`Too many students. Maximum 500 per import. Found ${students.length} students.`]
      studentsToImport.value = []
    } else {
      studentsToImport.value = students
      errors.value = parseErrors
    }
  }
  reader.onerror = () => {
    errors.value = ['Failed to read file. Please try again.']
    studentsToImport.value = []
  }
  reader.readAsText(file)
}

const clearFile = () => {
  selectedFileName.value = ''
  studentsToImport.value = []
  errors.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleImport = async () => {
  console.log('Import button clicked', studentsToImport.value)
  if (studentsToImport.value.length === 0) {
    console.log('No students to import')
    return
  }
  
  isProcessing.value = true
  importedCount.value = 0
  
  try {
    // Emit the import event with the students data
    emit('import', studentsToImport.value)
    // Close modal after successful import (parent component should handle the actual import)
    handleClose()
  } catch (error) {
    console.error('Import failed:', error)
    errors.value = ['Import failed. Please try again.']
  } finally {
    isProcessing.value = false
    importedCount.value = 0
  }
}

const handleClose = () => {
  if (!isProcessing.value) {
    clearFile()
    emit('close')
  }
}

const downloadTemplate = () => {
  downloadCSVTemplate()
}

// Reset when modal closes
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    clearFile()
  }
})
</script>