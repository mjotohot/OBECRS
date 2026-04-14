import { defineStore } from 'pinia'
import { ref } from 'vue'

// Adjust this to match your actual Course type
export interface Course {
  id: number
  adviser_id: number
  course_code: string
  course_title: string
  section: string
  created_at: string
  academic_year: number
}

export const useCourseStore = defineStore('course', () => {
  const selectedCourse = ref<Course | null>(null)

  const setCourse = (course: Course) => {
    selectedCourse.value = course
  }

  const clearCourse = () => {
    selectedCourse.value = null
  }

  return {
    selectedCourse,
    setCourse,
    clearCourse
  }
})