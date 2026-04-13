// src/stores/academicYear.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { academicYearService, type AcademicYear } from '@/services/academic-year.service'

export const useAcademicYearStore = defineStore('academicYear', () => {
  // State
  const activeYear = ref<AcademicYear | null>(null)
  const allYears = ref<AcademicYear[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getYearOptions = computed(() => 
    allYears.value.map(year => ({
      label: `${year.year} - ${year.semester}`,
      value: year.id
    }))
  )

  const hasActiveYear = computed(() => activeYear.value !== null)

  // Actions
  async function fetchActiveYear() {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await academicYearService.getActiveAcademicYear()
      activeYear.value = data
    } catch (err) {
      error.value = 'Failed to fetch active academic year'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllYears() {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await academicYearService.getAllAcademicYears()
      allYears.value = data
    } catch (err) {
      error.value = 'Failed to fetch academic years'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  async function createYear(yearData: Omit<AcademicYear, 'id'>) {
    isLoading.value = true
    error.value = null
    
    try {
      const newYear = await academicYearService.createAcademicYear(yearData)
      if (newYear) {
        await fetchAllYears() // Refresh the list
        return newYear
      }
      return null
    } catch (err) {
      error.value = 'Failed to create academic year'
      console.error(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateYear(id: number, updates: Partial<AcademicYear>) {
    isLoading.value = true
    error.value = null
    
    try {
      const updatedYear = await academicYearService.updateAcademicYear(id, updates)
      if (updatedYear) {
        await Promise.all([fetchActiveYear(), fetchAllYears()])
        return updatedYear
      }
      return null
    } catch (err) {
      error.value = 'Failed to update academic year'
      console.error(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function setActiveYear(id: number) {
    isLoading.value = true
    error.value = null
    
    try {
      const success = await academicYearService.setActiveYear(id)
      if (success) {
        await Promise.all([fetchActiveYear(), fetchAllYears()])
        return true
      }
      return false
    } catch (err) {
      error.value = 'Failed to set active year'
      console.error(err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    activeYear.value = null
    allYears.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    activeYear,
    allYears,
    isLoading,
    error,
    
    // Getters
    getYearOptions,
    hasActiveYear,
    
    // Actions
    fetchActiveYear,
    fetchAllYears,
    createYear,
    updateYear,
    setActiveYear,
    clearError,
    reset
  }
})