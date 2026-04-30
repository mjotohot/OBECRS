import { supabase } from "./supabase.service"

export interface CourseOutcome {
  id: number
  co_code: string
  co_description: string
  co_score: number | null  // Changed from 'number' to 'number | null'
  co_weight: number
  course_id: number
  created_at: string
}

export const getCourseOutcomes = async (courseId: number) => {
  try {
    const { data, error } = await supabase
      .from('course_outcomes')  
      .select('*')
      .eq('course_id', courseId)
      .order('co_code', { ascending: true })

    if (error) throw error
    return { data: data as CourseOutcome[], error: null }
  } catch (error) {
    console.error('Error fetching course outcomes:', error)
    return { data: null, error: 'Failed to fetch course outcomes' }
  }
}

export const updateCourseOutcome = async (outcomeId: number, updates: Partial<CourseOutcome>) => {
  try {
    const { data, error } = await supabase
      .from('course_outcomes')
      .update(updates)
      .eq('id', outcomeId)
      .select()
      .single()

    if (error) throw error
    return { data: data as CourseOutcome, error: null }
  } catch (error) {
    console.error('Error updating course outcome:', error)
    return { data: null, error: 'Failed to update course outcome' }
  }
}