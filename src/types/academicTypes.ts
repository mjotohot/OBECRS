export interface AcademicYear {
  id: number
  year: string
  semester: string
  is_active: string
  created_at?: string
}

export interface AcademicYearInsert {
  year: string
  semester: string
  is_active: string
}

export interface AcademicYearUpdate {
  year?: string
  semester?: string
  is_active?: string
}