import { supabase } from './supabase.service'
import type { AcademicYear, AcademicYearInsert, AcademicYearUpdate } from '@/types/academicTypes'

export type AuthResponse<T = any> = {
  data: T | null
  error: string | null
}

// Get all academic years
export async function getAcademicYears(): Promise<AuthResponse<AcademicYear[]>> {
  try {
    const { data, error } = await supabase
      .from('academic_year')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching academic years:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as AcademicYear[],
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to fetch academic years',
    }
  }
}

// Get active academic year
export async function getActiveAcademicYear(): Promise<AuthResponse<AcademicYear>> {
  try {
    const { data, error } = await supabase
      .from('academic_year')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching active academic year:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as AcademicYear,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to fetch active academic year',
    }
  }
}

// Create a new academic year
export async function createAcademicYear(
  academicYearData: AcademicYearInsert,
): Promise<AuthResponse<AcademicYear>> {
  try {
    // Validate required fields
    if (!academicYearData.year || !academicYearData.semester) {
      return {
        data: null,
        error: 'Missing required fields: year or semester',
      }
    }

    // If creating an active academic year, deactivate all others first
    if (academicYearData.is_active) {
      const { error: deactivateError } = await supabase
        .from('academic_year')
        .update({ is_active: false })
        .eq('is_active', true)

      if (deactivateError) {
        console.error('Error deactivating other academic years:', deactivateError)
        return {
          data: null,
          error: 'Failed to deactivate other academic years',
        }
      }
    }

    const { data, error } = await supabase
      .from('academic_year')
      .insert([
        {
          year: academicYearData.year,
          semester: academicYearData.semester,
          is_active: academicYearData.is_active,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating academic year:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as AcademicYear,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to create academic year',
    }
  }
}

// Update an existing academic year
export async function updateAcademicYear(
  academicYearId: number,
  updates: AcademicYearUpdate,
): Promise<AuthResponse<AcademicYear>> {
  try {
    // If setting this academic year as active, deactivate all others first
    if (updates.is_active === 'true') {
      const { error: deactivateError } = await supabase
        .from('academic_year')
        .update({ is_active: 'false' })
        .eq('is_active', 'true')
        .neq('id', academicYearId)

      if (deactivateError) {
        console.error('Error deactivating other academic years:', deactivateError)
        return {
          data: null,
          error: 'Failed to deactivate other academic years',
        }
      }
    }

    const { data, error } = await supabase
      .from('academic_year')
      .update(updates)
      .eq('id', academicYearId)
      .select()
      .single()

    if (error) {
      console.error('Error updating academic year:', error)
      return {
        data: null,
        error: error.message,
      }
    }

    return {
      data: data as AcademicYear,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: null,
      error: 'Failed to update academic year',
    }
  }
}

// Delete an academic year
export async function deleteAcademicYear(academicYearId: number): Promise<AuthResponse<void>> {
  try {
    // Check if this is the active academic year
    const { data: academicYear, error: fetchError } = await supabase
      .from('academic_year')
      .select('is_active')
      .eq('id', academicYearId)
      .single()

    if (fetchError) {
      console.error('Error fetching academic year:', fetchError)
      return {
        data: null,
        error: fetchError.message,
      }
    }

    // Prevent deletion of active academic year
    if (academicYear?.is_active) {
      return {
        data: null,
        error: 'Cannot delete the active academic year. Please set another academic year as active first.',
      }
    }

    const { error } = await supabase
      .from('academic_year')
      .delete()
      .eq('id', academicYearId)

    if (error) {
      console.error('Error deleting academic year:', error)
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
      error: 'Failed to delete academic year',
    }
  }
}

// Set an academic year as active (convenience function)
export async function setActiveAcademicYear(academicYearId: number): Promise<AuthResponse<AcademicYear>> {
  return updateAcademicYear(academicYearId, { is_active: 'true' })
}