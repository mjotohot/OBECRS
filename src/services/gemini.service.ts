// services/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from './supabase.service'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export interface ExtractedAssessment {
  co: string
  task: string
  task_weight_within_category: string
  final_co_contribution: number
  domain: string
}

export interface ExtractedData {
  assessments: ExtractedAssessment[]
}

export const extractCOsFromPDF = async (pdfFile: File): Promise<ExtractedData> => {
  try {
    // Convert PDF to base64
    const base64PDF = await fileToGenerativePart(pdfFile)
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    
    const prompt = `You are a specialized Data Extraction Assistant.
    
Extract all assessment tasks from the 'Detailed Assessment Weights' table in Part IV of the provided document.

Constraint Rules:
1. Granularity: You must separate collective tasks (e.g., 'Laboratory Activities 1-11') into individual objects for each item (1, 2, 3... 11).
2. Object Structure: Each object in the JSON array must contain exactly these keys: co, task, task_weight_within_category, final_co_contribution, and domain.
3. Data Normalization: For domain, use the shorthand codes: C (Cognitive), P (Psychomotor), A (Affective).
4. For final_co_contribution, calculate the specific percentage weight assigned to that individual task relative to the total course grade.

Return ONLY a valid JSON object. No markdown, no conversational text.

Schema Template:
{
  "assessments": [
    {
      "co": "string",
      "task": "string",
      "task_weight_within_category": "string",
      "final_co_contribution": number,
    }
  ]
}`

    const result = await model.generateContent([prompt, base64PDF])
    const response = await result.response
    const text = response.text()
    
    // Clean the response (remove markdown code blocks if present)
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/, '').replace(/```\n?$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/, '').replace(/```\n?$/, '')
    }
    
    const extractedData: ExtractedData = JSON.parse(cleanText)
    return extractedData
  } catch (error) {
    console.error('Error extracting COs from PDF:', error)
    throw new Error('Failed to extract course outcomes from syllabus')
  }
}

const fileToGenerativePart = async (file: File): Promise<{
  inlineData: { data: string; mimeType: string }
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (!reader.result || typeof reader.result !== 'string') {
        reject(new Error('Failed to read file as base64'))
        return
      }
      const base64Data = reader.result.split(',')[1]
      if (!base64Data) {
        reject(new Error('Invalid base64 data format'))
        return
      }
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const insertCourseOutcomes = async (
  courseId: number,
  assessments: ExtractedAssessment[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, get the existing course outcomes for this course
    const { data: existingOutcomes, error: fetchError } = await supabase
      .from('course_outcomes')
      .select('*')
      .eq('course_id', courseId)

    if (fetchError) throw fetchError

    // Prepare the new outcomes to insert
    const outcomesToInsert = assessments.map(assessment => ({
      course_id: courseId,
      co_code: assessment.co,
      co_description: assessment.task,
      co_score: null, // Will be set by faculty later
      co_weight: assessment.final_co_contribution / 100, // Convert percentage to decimal
      created_at: new Date().toISOString()
    }))

    // Delete existing outcomes for this course
    if (existingOutcomes && existingOutcomes.length > 0) {
      const { error: deleteError } = await supabase
        .from('course_outcomes')
        .delete()
        .eq('course_id', courseId)

      if (deleteError) throw deleteError
    }

    // Insert new outcomes
    const { error: insertError } = await supabase
      .from('course_outcomes')
      .insert(outcomesToInsert)

    if (insertError) throw insertError

    return { success: true }
  } catch (error) {
    console.error('Error inserting course outcomes:', error)
    return { success: false, error: 'Failed to insert course outcomes' }
  }
}