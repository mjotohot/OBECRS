import { supabase } from "./supabase.service"


export interface Grade {
  id?: number
  enrollment_id: number
  course_outcome_id: number
  score: number  // ← was 'grade', correct column is 'score'
}

export const getGradesByEnrollments = async (enrollmentIds: number[]) => {
  const { data, error } = await supabase
    .from('grades')
    .select('enrollment_id, course_outcome_id, score')  // ← 'score' not 'grade'
    .in('enrollment_id', enrollmentIds)

  return { data, error: error?.message ?? null }
}

export const upsertGrade = async (grade: Grade) => {
  const { data, error } = await supabase
    .from('grades')
    .upsert(grade, { onConflict: 'enrollment_id,course_outcome_id' })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}