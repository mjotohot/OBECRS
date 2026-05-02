import { supabase } from './supabase.service'
import type { StudentInsert, StudentUpdate } from '@/types/studentTypes'

export interface Student {
  id: number
  id_number: string
  adviser_id: number
  name: string
}

export type AuthResponse<T = any> = {
  data: T | null
  error: string | null
}

export interface EnrolledCourse {
  course_code: string
  course_title?: string
}

// Get all students for a specific adviser/faculty
export async function getStudentsByAdviser(adviserId: number): Promise<AuthResponse<Student[]>> {
  try {
    let query = supabase.from('students').select('*').eq('adviser_id', adviserId)
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as Student[],
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to fetch courses',
    }
  }
}

// student.service.ts
export const getStudentsByCourse = async (courseId: number) => {
  try {
    const { data, error } = await supabase
      .from('enrollment')
      .select('students(*)')
      .eq('course_id', courseId)

    if (error) return { data: null, error: error.message }

    // Flatten the nested students out of the join
    const students = data?.map((row: any) => row.students) || []
    return { data: students, error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch students' }
  }
}

export const getEnrollmentsByCourse = async (courseId: number) => {
  try {
    const { data, error } = await supabase
      .from('enrollment')
      .select('id, student_id') // ← make sure 'id' is here
      .eq('course_id', courseId)

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch enrollments' }
  }
}

export async function createStudent(
  studentData: StudentInsert,
  adviserId: number,
): Promise<AuthResponse<Student>> {
  try {
    // Validate required fields
    if (!studentData.id_number || !studentData.name) {
      return {
        data: null,
        error: 'Missing required fields: id_number or name',
      }
    }

    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          adviser_id: adviserId,
          id_number: studentData.id_number,
          name: studentData.name,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as Student,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to create student',
    }
  }
}

// Update an existing student
export async function updateStudent(
  studentId: number,
  updates: StudentUpdate,
): Promise<AuthResponse<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as Student,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to update student',
    }
  }
}

export const getEnrolledCoursesByStudentIds = async (
  studentIds: number[],
): Promise<Record<number, EnrolledCourse[]>> => {
  if (studentIds.length === 0) return {}

  const { data, error } = await supabase
    .from('enrollment')
    .select('student_id, courses ( course_code, course_title )')
    .in('student_id', studentIds)

  if (error) {
    console.error('Error fetching enrolled courses:', error)
    return {}
  }

  const result: Record<number, EnrolledCourse[]> = {}
  for (const row of data) {
    const sid = row.student_id
    if (!result[sid]) result[sid] = []
    // row.courses might be an object (if single) or an array; Supabase returns object for one-to-one
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses
    if (course) {
      result[sid].push({
        course_code: course.course_code,
        course_title: course.course_title,
      })
    }
  }
  return result
}

// Add this function to your student.service.ts

export async function bulkCreateStudents(
  studentsData: Array<{ id_number: string; name: string }>,
  adviserId: number,
): Promise<AuthResponse<Student[]>> {
  try {
    // Validate data
    if (!studentsData.length) {
      return {
        data: null,
        error: 'No student data provided',
      }
    }

    // Prepare data for insert
    const studentsToInsert = studentsData.map(student => ({
      adviser_id: adviserId,
      id_number: student.id_number.trim(),
      name: student.name.trim(),
    }))

    // Insert in batches to avoid overwhelming the database
    const batchSize = 50
    const allInsertedStudents: Student[] = []
    
    for (let i = 0; i < studentsToInsert.length; i += batchSize) {
      const batch = studentsToInsert.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('students')
        .insert(batch)
        .select()

      if (error) {
        console.error('Error bulk creating students:', error)
        return {
          data: null,
          error: `Failed to insert batch at index ${i}: ${error.message}`,
        }
      }

      if (data) {
        allInsertedStudents.push(...(data as Student[]))
      }
    }

    return {
      data: allInsertedStudents,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error during bulk insert:', err)
    return {
      data: null,
      error: 'Failed to bulk create students',
    }
  }
}

// Delete a student
export async function deleteStudent(studentId: number): Promise<AuthResponse<void>> {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)

    if (error) {
      console.error('Error deleting student:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to delete student',
    }
  }
}