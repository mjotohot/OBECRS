// services/course.service.ts
import { supabase } from './supabase.service'
import { useAcademicYearStore } from '@/stores/academicYear'
import type {CourseFilters, CourseResponse, CourseInsert, CourseUpdate } from '../types/courseTypes'

// Type definitions for the course table based on your schema
export type CourseStatus = 'Not Started' | 'In Progress' | 'Completed'
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


export type AuthResponse<T = any> = {
  data: T | null
  error: string | null
}

// Get all courses for a specific adviser/faculty
export async function getAllCourses(): Promise<AuthResponse<Course[]>> {
  try {
    // Get active academic year from store
    const academicYearStore = await useAcademicYearStore()
    await academicYearStore.fetchActiveYear()
    console.log('Active Academic Year in Store:', academicYearStore.activeYear)
    const activeYearId = academicYearStore.activeYear?.id
    
    let query = supabase
      .from('courses')
      .select('*')
      .eq('status', 'In Progress')
  
    if (activeYearId) {
      query = query.eq('academic_year', activeYearId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course[],
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

// Get all courses for a specific adviser/faculty
export async function getCoursesByAdviser(adviserId: number): Promise<AuthResponse<Course[]>> {
  try {
    // Get active academic year from store
    const academicYearStore = await useAcademicYearStore()
    await academicYearStore.fetchActiveYear()
    console.log('Active Academic Year in Store:', academicYearStore.activeYear)
    const activeYearId = academicYearStore.activeYear?.id
    
    let query = supabase
      .from('courses')
      .select('*')
      .eq('adviser_id', adviserId)
    
    // Only filter by academic year if there's an active one
    if (activeYearId) {
      query = query.eq('academic_year', activeYearId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course[],
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

// Get all courses for a specific adviser/faculty
export async function getCourseOutcomeByCourse(courseId: number): Promise<AuthResponse<Course[]>> {
  try {
  
    
    let query = supabase
      .from('course_outcomes')
      .select('*')
      .eq('course_id', courseId)
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course[],
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


// Get courses with filters
export async function getCoursesWithFilters(filters: CourseFilters): Promise<AuthResponse<Course[]>> {
  try {
    let query = supabase.from('courses').select('*')

    // Apply filters dynamically
    if (filters.adviser_id) {
      query = query.eq('adviser_id', filters.adviser_id)
    }
    if (filters.academic_year) {
      query = query.eq('academic_year', filters.academic_year)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.course_code) {
      query = query.ilike('course_code', `%${filters.course_code}%`)
    }
    if (filters.section) {
      query = query.ilike('section', `%${filters.section}%`)
    }

    const { data, error } = await query.order('course_code', { ascending: true })

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course[],
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to fetch courses with filters'
    }
  }
}

// Get a single course by ID
export async function getCourseById(courseId: number): Promise<AuthResponse<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to fetch course details'
    }
  }
}

export async function createCourse(courseData: CourseInsert, adviserId: number): Promise<AuthResponse<Course>> {
  try {
    // Validate required fields
    if (!courseData.course_code || !courseData.course_title || !courseData.section) {
      return {
        data: null,
        error: 'Missing required fields: course_code, course_title, or section'
      }
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{
        adviser_id: adviserId, 
        course_code: courseData.course_code,
        course_title: courseData.course_title,
        section: courseData.section,
        academic_year: courseData.academic_year,
        status: courseData.status || 'Not Started'
      }])
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
      data: data as Course,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to create course'
    }
  }
}


// Update an existing course
export async function updateCourse(courseId: number, updates: CourseUpdate): Promise<AuthResponse<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to update course'
    }
  }
}

// Update course status specifically
export async function updateCourseStatus(courseId: number, status: CourseStatus): Promise<AuthResponse<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update({ status })
      .eq('id', courseId)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to update course status'
    }
  }
}

// Delete a course
export async function deleteCourse(courseId: number): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: null,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to delete course'
    }
  }
}

// Get courses for the current academic year
export async function getCurrentAcademicYearCourses(adviserId: number): Promise<AuthResponse<Course[]>> {
  try {
    const currentYear = new Date().getFullYear()
    const academicYear = currentYear // Adjust this logic based on your academic year format

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('adviser_id', adviserId)
      .eq('academic_year', academicYear)
      .order('course_code', { ascending: true })

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course[],
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to fetch current academic year courses'
    }
  }
}

// Bulk insert courses (useful for importing)
export async function bulkCreateCourses(coursesData: CourseInsert[]): Promise<AuthResponse<Course[]>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert(coursesData)
      .select()

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course[],
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to bulk create courses'
    }
  }
}

// Get course statistics for a faculty member
export async function getCourseStatistics(adviserId: number): Promise<AuthResponse<{
  total: number
  notStarted: number
  inProgress: number
  completed: number
}>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('status')
      .eq('adviser_id', adviserId)

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    const stats = {
      total: data.length,
      notStarted: data.filter(c => c.status === 'Not Started').length,
      inProgress: data.filter(c => c.status === 'In Progress').length,
      completed: data.filter(c => c.status === 'Completed').length
    }

    return {
      data: stats,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to fetch course statistics'
    }
  }
}

// Search courses by title or code
export async function searchCourses(adviserId: number, searchTerm: string): Promise<AuthResponse<Course[]>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('adviser_id', adviserId)
      .or(`course_code.ilike.%${searchTerm}%,course_title.ilike.%${searchTerm}%`)
      .order('course_code', { ascending: true })

    if (error) {
      return {
        data: null,
        error: error.message
      }
    }

    return {
      data: data as Course[],
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to search courses'
    }
  }
}