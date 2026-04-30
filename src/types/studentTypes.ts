export interface Student {
  id: number
  id_number: string
  adviser_id: number
  name: string
  created_at?: string
  status?: 'Active' | 'Inactive'
  enrolledCourses?: { course_code: string; course_title?: string }[]
}

export interface StudentInsert {
  adviser_id: number
  id_number: string
  name: string
}

export interface StudentUpdate {
  id_number?: string
  name?: string
}
