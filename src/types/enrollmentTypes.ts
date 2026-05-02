// types/enrollmentTypes.ts
export interface Enrollment {
  id: number
  created_at: string
  course_id: number
  student_id: number
  status?: 'passed' | 'failed' | null  // Add status field
}

export interface EnrollmentWithDetails extends Enrollment {
  course?: {
    id: number
    course_code: string
    course_title: string
    section: string
    academic_year: number
  }
  student?: {
    id: number
    name: string
    id_number: string
  }
}

export interface EnrollmentFormData {
  student_id: number
  course_id: number
  status?: 'passed' | 'failed' | null
}