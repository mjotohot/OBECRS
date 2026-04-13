// src/services/academic-year.service.ts
import { supabase } from "@/services/supabase.service"

export interface AcademicYear {
  id: number
  year: string
  semester: string
  isActive: boolean
}

export const academicYearService = {
  async getActiveAcademicYear(): Promise<AcademicYear | null> {
    try {
      const { data, error } = await supabase
        .from('academic_year')
        .select('*')
        .eq('is_active', true)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching active academic year:', error)
      return null
    }
  },

  async getAllAcademicYears(): Promise<AcademicYear[]> {
    try {
      const { data, error } = await supabase
        .from('academic_year')
        .select('*')
        .order('year', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all academic years:', error)
      return []
    }
  },

  async createAcademicYear(year: Omit<AcademicYear, 'id'>): Promise<AcademicYear | null> {
    try {
      const { data, error } = await supabase
        .from('academic_year')
        .insert([year])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating academic year:', error)
      return null
    }
  },

  async updateAcademicYear(id: number, updates: Partial<AcademicYear>): Promise<AcademicYear | null> {
    try {
      const { data, error } = await supabase
        .from('academic_year')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating academic year:', error)
      return null
    }
  },

  async setActiveYear(id: number): Promise<boolean> {
    try {
      // First, deactivate all years
      const { error: deactivateError } = await supabase
        .from('academic_year')
        .update({ is_active: false })
        .neq('id', id)
      
      if (deactivateError) throw deactivateError

      // Then activate the selected year
      const { error: activateError } = await supabase
        .from('academic_year')
        .update({ is_active: true })
        .eq('id', id)
      
      if (activateError) throw activateError
      
      return true
    } catch (error) {
      console.error('Error setting active year:', error)
      return false
    }
  }
}