// types/courseTypes.ts
export type CourseStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Archived'

export interface Course {
  id: number
  adviser_id: number
  course_code: string
  course_title: string
  section: string
  created_at: string
  academic_year: number
  status: CourseStatus
}

export interface CourseInsert {
  adviser_id: number
  course_code: string
  course_title: string
  section: string
  academic_year: number
  status?: CourseStatus
}

export interface CourseUpdate {
  course_code?: string
  course_title?: string
  section?: string
  academic_year?: number
  status?: CourseStatus
}

export interface CourseFilters {
  adviser_id?: number
  academic_year?: number
  status?: CourseStatus
  course_code?: string
  section?: string
}

export interface CourseResponse {
  data: Course | Course[] | null
  error: string | null
}
