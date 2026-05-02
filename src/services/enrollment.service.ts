// services/enrollment.service.ts
import { supabase } from './supabase.service'
import type { Enrollment, EnrollmentWithDetails } from '@/types/enrollmentTypes'

export type AuthResponse<T = any> = {
  data: T | null
  error: string | null
}

// Enroll a student in a course
export async function enrollStudent(studentId: number, courseId: number): Promise<AuthResponse<Enrollment>> {
  try {
    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollment')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      return { data: null, error: 'Student is already enrolled in this course' }
    }

    const { data, error } = await supabase
      .from('enrollment')
      .insert([{
        student_id: studentId,
        course_id: courseId,
        status: null, // Initialize status as null
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error enrolling student:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Enrollment, error: null }
  } catch (err) {
    return { data: null, error: 'Failed to enroll student' }
  }
}

// Update enrollment status
export async function updateEnrollmentStatus(
  enrollmentId: number, 
  status: 'passed' | 'failed' | null
): Promise<AuthResponse<Enrollment>> {
  try {
    const { data, error } = await supabase
      .from('enrollment')
      .update({ status })
      .eq('id', enrollmentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating enrollment status:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Enrollment, error: null }
  } catch (err) {
    return { data: null, error: 'Failed to update enrollment status' }
  }
}

// Remove student from a course (drop enrollment)
export async function dropEnrollment(enrollmentId: number): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase
      .from('enrollment')
      .delete()
      .eq('id', enrollmentId)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: 'Failed to drop enrollment' }
  }
}

// Get all enrollments for a student
export async function getStudentEnrollments(studentId: number): Promise<AuthResponse<EnrollmentWithDetails[]>> {
  try {
    const { data, error } = await supabase
      .from('enrollment')
      .select(`
        *,
        course:courses(
          id,
          course_code,
          course_title,
          section,
          academic_year,
          adviser_id
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as EnrollmentWithDetails[], error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch student enrollments' }
  }
}

// Get all students enrolled in a course
export async function getCourseEnrollments(courseId: number): Promise<AuthResponse<EnrollmentWithDetails[]>> {
  try {
    const { data, error } = await supabase
      .from('enrollment')
      .select(`
        *,
        student:students(
          id,
          name,
          id_number,
          adviser_id
        )
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as EnrollmentWithDetails[], error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch course enrollments' }
  }
}

// Get available courses for a student (not yet enrolled) - filtered by adviser_id
export async function getAvailableCoursesForStudent(
  studentId: number, 
  adviserId: number,
  academicYearId?: number
): Promise<AuthResponse<any[]>> {
  try {
    console.log('Fetching available courses for student:', studentId, 'adviser:', adviserId, 'academic year:', academicYearId)
    
    // First, get enrolled course IDs for this student
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollment')
      .select('course_id')
      .eq('student_id', studentId)

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError)
      return { data: null, error: enrollError.message }
    }

    const enrolledCourseIds = enrollments?.map(e => e.course_id) || []
    console.log('Enrolled course IDs:', enrolledCourseIds)

    // Build query for available courses
    let query = supabase
      .from('courses')
      .select('*')
      .eq('adviser_id', adviserId) // Filter by logged in adviser

    // Exclude already enrolled courses
    if (enrolledCourseIds.length > 0) {
      query = query.not('id', 'in', `(${enrolledCourseIds.join(',')})`)
    }

    // Filter by academic year if provided
    if (academicYearId) {
      query = query.eq('academic_year', academicYearId)
    }

    const { data, error } = await query.order('course_code', { ascending: true })

    if (error) {
      console.error('Error fetching available courses:', error)
      return { data: null, error: error.message }
    }

    console.log('Available courses found:', data?.length || 0)
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: 'Failed to fetch available courses' }
  }
}

// Get all courses for an adviser (without enrollment check)
export async function getAdviserCourses(adviserId: number, academicYearId?: number): Promise<AuthResponse<any[]>> {
  try {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('adviser_id', adviserId)

    if (academicYearId) {
      query = query.eq('academic_year', academicYearId)
    }

    const { data, error } = await query.order('course_code', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch adviser courses' }
  }
}

// Get enrollments by adviser (all enrollments for courses owned by adviser)
export async function getEnrollmentsByAdviser(adviserId: number): Promise<AuthResponse<EnrollmentWithDetails[]>> {
  try {
    const { data, error } = await supabase
      .from('enrollment')
      .select(`
        *,
        student:students(
          id,
          name,
          id_number
        ),
        course:courses(
          id,
          course_code,
          course_title,
          section,
          academic_year
        )
      `)
      .eq('course.adviser_id', adviserId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as EnrollmentWithDetails[], error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch enrollments by adviser' }
  }
}

// Get enrollments with filters (including adviser_id)
export async function getEnrollmentsWithFilters(
  filters: {
    adviser_id?: number
    student_id?: number
    course_id?: number
    academic_year?: number
  }
): Promise<AuthResponse<EnrollmentWithDetails[]>> {
  try {
    let query = supabase
      .from('enrollment')
      .select(`
        *,
        student:students(
          id,
          name,
          id_number
        ),
        course:courses(
          id,
          course_code,
          course_title,
          section,
          academic_year,
          adviser_id
        )
      `)

    if (filters.adviser_id) {
      query = query.eq('course.adviser_id', filters.adviser_id)
    }
    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id)
    }
    if (filters.course_id) {
      query = query.eq('course_id', filters.course_id)
    }
    if (filters.academic_year) {
      query = query.eq('course.academic_year', filters.academic_year)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as EnrollmentWithDetails[], error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch enrollments with filters' }
  }
}