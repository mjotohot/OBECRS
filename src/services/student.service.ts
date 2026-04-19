import { supabase } from "./supabase.service";
import type { StudentInsert, StudentUpdate } from "@/types/studentTypes";

export interface Student {
  id: number
  id_number : string
  adviser_id : number
  name : string
}

export type AuthResponse<T = any> = {
  data: T | null
  error: string | null
}


// Get all students for a specific adviser/faculty
export async function getStudentsByAdviser(adviserId: number): Promise<AuthResponse<Student[]>> {
  try {    
    let query = supabase
      .from('students')
      .select('*')
      .eq('adviser_id', adviserId)
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Student[],
      error: null
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to fetch courses'
    }
  }
}

// student.service.ts
export const getStudentsByCourse = async (courseId: number) => {
  try {
    const { data, error } = await supabase
      .from('enrollment')          // adjust table name to match your schema
      .select('students(*)')        // assumes enrollments has a FK to students
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
      .select('id, student_id')  // ← make sure 'id' is here
      .eq('course_id', courseId)

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Failed to fetch enrollments' }
  }
}

export async function createStudent (studentData: StudentInsert, adviserId: number): Promise<AuthResponse<Student>> {
  try {
    // Validate required fields
    if (!studentData.id_number || !studentData.name) {
      return {
        data: null,
        error: 'Missing required fields: id_number or name'
      }
    }

    const { data, error } = await supabase
      .from('students')
      .insert([{
        adviser_id: adviserId,
        id_number: studentData.id_number,
        name: studentData.name
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Student,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to create student'
    }
  }
}


// Update an existing student
export async function updateStudent(studentId: number, updates: StudentUpdate): Promise<AuthResponse<Student>> {
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
        error: error.message
      }
    }

    return {
      data: data as Student,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to update student'
    }
  }
}

