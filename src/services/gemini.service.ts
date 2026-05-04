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

export class MissingAssessmentsError extends Error {
  public missingTasks: string[]

  constructor(message: string, missingTasks: string[] = []) {
    super(message)
    this.name = 'MissingAssessmentsError'
    this.missingTasks = missingTasks
  }
}

export const extractCOsFromPDF = async (pdfFile: File): Promise<ExtractedData> => {
  try {
    console.log('Starting PDF extraction...', pdfFile.name, pdfFile.size)

    if (pdfFile.size > 20 * 1024 * 1024) {
      throw new Error('PDF file too large. Please use a file smaller than 20MB.')
    }

    const base64PDF = await fileToGenerativePart(pdfFile)
    console.log('PDF converted to base64')

    const model = genAI.getGenerativeModel({
      // model: 'gemini-3-flash-preview',
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
    })

    const prompt2 = `STRICT AUDIT PROTOCOL - NO EXCEPTIONS

STEP 1: Extract ALL task names from Part IV table
- Expand ranges: "Laboratory Activity 1-11" → ["Laboratory Activity 1", "Laboratory Activity 2", ..., "Laboratory Activity 11"]
- List EVERY individual task

STEP 2: Search Part III for matches (EXACT or COMBINED)
For EACH task from Part IV, search the "ASSESSMENT" columns in Part III "Teaching and Learning Plan" table using these matching rules:

  RULE A – Exact match: "Laboratory Activity 6" found as "Laboratory Activity 6" ✓
  
  RULE B – Combined with ampersand: "Laboratory Activity 2" is covered if Part III contains
           "Laboratory Activity 2 & 3" or "Laboratory Activity 2 & 3 & 4", etc. ✓
  
  RULE C – Combined with range/dash: "Laboratory Activity 2" is covered if Part III contains
           "Laboratory Activity 2-3" or "Laboratory Activity 2–4", etc. ✓
  
  RULE D – Combined with comma: "Laboratory Activity 2" is covered if Part III contains
           "Laboratory Activity 2, 3" or "Laboratory Activity 2, 3, 4", etc. ✓

  A task is considered FOUND if its number appears in ANY of the above patterns.
  A task is MISSING only if no entry in Part III covers it under any of the above rules.

STEP 3: Verdict
IF ANY task from Part IV is NOT found in Part III (under any rule above):
  Output as JSON (no markdown):
  {
    "status": "missing",
    "missing_tasks": ["Laboratory Activity 6", "Laboratory Activity 7", ...]
  }
  
IF ALL tasks found:
  Extract to JSON (no markdown):
  {
    "assessments": [
      {
        "co": "CO1",
        "task": "Laboratory Activity 1",
        "task_weight_within_category": "9.09%",
        "final_co_contribution": 0.909,
      }
    ]
  }

CRITICAL: Apply all four matching rules before declaring a task missing. Only flag a task as missing if it genuinely cannot be found under any rule.`

const prompt = `Role: You are a specialized Data Extraction Assistant.
Task: Extract specific tabular data from the "PART IV: GRADING SYSTEM" section of a Course Syllabus PDF.

Instruction:
Extract all assessment tasks from the "Detailed Assessment Weights" table in Part IV of the provided document.

Constraint Rules:

Granularity: You must separate collective tasks (e.g., "Laboratory Activities 1-11") into individual objects for each item (Activity 1, Activity 2, etc.).

Object Structure: Each object in the JSON array must contain exactly these keys: co, task, task_weight_within_category, final_co_contribution, and domain.

Data Normalization:

For domain, use the shorthand codes: C (Cognitive), P (Psychomotor), A (Affective).

Numerical Cleaning: Strip the percentage symbol (%) and any non-numeric characters from weight values. For example, if the document says "7.5%", extract it as 7.5.

Calculations: For final_co_contribution, calculate the specific percentage weight assigned to that individual task relative to the total course grade (100%).

Output Format: Return ONLY a valid JSON object. No markdown, no conversational text, and no pre-amble.
Schema Template:

JSON
{
  "assessments": [
    {
      "co": "string",
      "task": "string",
      "task_weight_within_category": "string",
      "final_co_contribution": "percentage",
    }
  ]
}`

    console.log('Sending request to Gemini API...')
    const result = await model.generateContent([prompt, base64PDF])
    console.log('Received response from Gemini API')

    const response = await result.response
    let text = response.text().trim()
    console.log('Raw response:', text.substring(0, 500))

    // Aggressively strip all markdown fences and surrounding whitespace
    text = text
      .replace(/^```[\w]*\n?/gm, '')
      .replace(/^```\n?/gm, '')
      .trim()

    // If Gemini wrapped the JSON in extra text, extract just the JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }

    console.log('Cleaned text before parse:', text.substring(0, 500))
    console.log('Parsing JSON response...')

    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(text)
    } catch (parseError) {
      console.warn('JSON parse failed. Attempting salvage. Raw text was:', text)

      // Find the last complete JSON object entry and close the structure
      const lastCompleteObject = text.lastIndexOf('},')
      if (lastCompleteObject !== -1) {
        const salvaged = text.substring(0, lastCompleteObject + 1) + ']}'
        try {
          parsedResponse = JSON.parse(salvaged)
          console.warn('Salvaged truncated JSON successfully. Some assessments may be missing.')
        } catch {
          throw new SyntaxError('JSON parse failed')
        }
      } else {
        throw new SyntaxError('JSON parse failed')
      }
    }
    // Check if there are missing tasks
    if (parsedResponse.status === 'missing' && parsedResponse.missing_tasks?.length > 0) {
      const missingTasksList = parsedResponse.missing_tasks.join(', ')
      throw new MissingAssessmentsError(
        `Syllabus validation failed: The following assessment tasks in Part IV are not listed in Part III: ${missingTasksList}`,
        parsedResponse.missing_tasks,
      )
    }

    // Extract the assessments
    const extractedData: ExtractedData = {
      assessments: parsedResponse.assessments || [],
    }

    if (!extractedData.assessments?.length) {
      throw new MissingAssessmentsError('No assessments found in syllabus.')
    }

    console.log(`Successfully extracted ${extractedData.assessments.length} assessments`)
    return extractedData
  } catch (error: any) {
    console.error('Detailed error in extractCOsFromPDF:', error)

    if (error instanceof MissingAssessmentsError) {
      throw error
    }

    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error:', error.message)
      throw new Error('Invalid syllabus format. Unable to parse assessment data.')
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('API rate limit reached. Please wait a moment and try again.')
    }

    if (error.message?.includes('API key')) {
      throw new Error('API configuration error. Please contact support.')
    }

    throw new Error(`Failed to extract course outcomes: ${error.message || 'Unknown error'}`)
  }
}

const fileToGenerativePart = async (
  file: File,
): Promise<{
  inlineData: { data: string; mimeType: string }
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      if (!result) {
        reject(new Error('Failed to read file: No data'))
        return
      }
      const base64Data = result.split(',')[1]
      if (!base64Data) {
        reject(new Error('Failed to read file: Invalid format'))
        return
      }
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/pdf',
        },
      })
    }
    reader.onerror = () => reject(new Error('File read error: ' + reader.error?.message))
    reader.readAsDataURL(file)
  })
}

export const insertCourseOutcomes = async (
  courseId: number,
  assessments: ExtractedAssessment[],
): Promise<{ success: boolean; error?: string }> => {
  try {
    await supabase.from('course_outcomes').delete().eq('course_id', courseId)

    const outcomesToInsert = assessments.map((a) => ({
      course_id: courseId,
      co_code: a.co,
      co_description: a.task,
      co_score: null,
      co_weight: a.final_co_contribution,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('course_outcomes').insert(outcomesToInsert)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('DB insert error:', error)
    return { success: false, error: 'Failed to save outcomes' }
  }
}
