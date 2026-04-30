// services/grades.service.ts
import { supabase } from "./supabase.service"

export interface Grade {
  id?: number
  enrollment_id: number
  course_outcome_id: number
  score: number
}

export interface BulkUpsertGradesData {
  enrollment_id: number
  grades: Array<{
    course_outcome_id: number
    score: number
  }>
}

export const getGradesByEnrollments = async (enrollmentIds: number[]) => {
  const { data, error } = await supabase
    .from('grades')
    .select('enrollment_id, course_outcome_id, score')
    .in('enrollment_id', enrollmentIds)

  return { data, error: error?.message ?? null }
}

export const getGradesByEnrollment = async (enrollmentId: number) => {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('enrollment_id', enrollmentId)

  return { data, error: error?.message ?? null }
}

export const getGradeByEnrollmentAndOutcome = async (enrollmentId: number, courseOutcomeId: number) => {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('course_outcome_id', courseOutcomeId)
    .maybeSingle() // Use maybeSingle() instead of single() to avoid errors

  return { data, error: error?.message ?? null }
}

// Updated upsertGrade without ON CONFLICT and without .single() issues
export const upsertGrade = async (grade: Grade) => {
  try {
    // First, check if the grade already exists
    const { data: existingGrade, error: findError } = await getGradeByEnrollmentAndOutcome(
      grade.enrollment_id, 
      grade.course_outcome_id
    )
    
    if (findError) {
      return { data: null, error: findError }
    }
    
    let result
    if (existingGrade) {
      // Update existing grade
      const { data, error } = await supabase
        .from('grades')
        .update({ score: grade.score })
        .eq('id', existingGrade.id)
        .select()
      
      if (error) {
        return { data: null, error: error.message }
      }
      
      result = { data: data?.[0] || null, error: null }
    } else {
      // Insert new grade
      const { data, error } = await supabase
        .from('grades')
        .insert({
          enrollment_id: grade.enrollment_id,
          course_outcome_id: grade.course_outcome_id,
          score: grade.score
        })
        .select()
      
      if (error) {
        return { data: null, error: error.message }
      }
      
      result = { data: data?.[0] || null, error: null }
    }
    
    return result
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Bulk upsert grades
export const bulkUpsertGrades = async (data: BulkUpsertGradesData) => {
  try {
    const results = []
    const errors = []
    
    // Process each grade sequentially to avoid conflicts
    for (const grade of data.grades) {
      const result = await upsertGrade({
        enrollment_id: data.enrollment_id,
        course_outcome_id: grade.course_outcome_id,
        score: grade.score
      })
      
      if (result.error) {
        errors.push(`CO ${grade.course_outcome_id}: ${result.error}`)
      } else if (result.data) {
        results.push(result.data)
      }
    }
    
    if (errors.length > 0) {
      return { data: results, error: errors.join('; ') }
    }
    
    return { data: results, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Alternative: Bulk upsert using transaction (more efficient)
export const bulkUpsertGradesTransaction = async (data: BulkUpsertGradesData) => {
  try {
    // Get existing grades
    const { data: existingGrades, error: fetchError } = await supabase
      .from('grades')
      .select('id, course_outcome_id')
      .eq('enrollment_id', data.enrollment_id)
      .in('course_outcome_id', data.grades.map(g => g.course_outcome_id))
    
    if (fetchError) {
      return { data: null, error: fetchError.message }
    }
    
    // Separate updates and inserts
    const existingMap = new Map()
    existingGrades?.forEach(grade => {
      existingMap.set(grade.course_outcome_id, grade.id)
    })
    
    const updates = []
    const inserts = []
    
    for (const grade of data.grades) {
      if (existingMap.has(grade.course_outcome_id)) {
        updates.push({
          id: existingMap.get(grade.course_outcome_id),
          score: grade.score
        })
      } else {
        inserts.push({
          enrollment_id: data.enrollment_id,
          course_outcome_id: grade.course_outcome_id,
          score: grade.score
        })
      }
    }
    
    // Perform updates
    let updateResults = []
    if (updates.length > 0) {
      for (const update of updates) {
        const { data: updated, error } = await supabase
          .from('grades')
          .update({ score: update.score })
          .eq('id', update.id)
          .select()
        
        if (!error && updated) {
          updateResults.push(...updated)
        }
      }
    }
    
    // Perform inserts
    let insertResults = []
    if (inserts.length > 0) {
      const { data: inserted, error } = await supabase
        .from('grades')
        .insert(inserts)
        .select()
      
      if (!error && inserted) {
        insertResults = inserted
      }
    }
    
    return { 
      data: [...updateResults, ...insertResults], 
      error: null 
    }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const deleteGrade = async (gradeId: number) => {
  const { error } = await supabase
    .from('grades')
    .delete()
    .eq('id', gradeId)

  return { error: error?.message ?? null }
}