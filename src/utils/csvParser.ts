export interface ParsedStudent {
  id_number: string
  name: string
  errors?: string[]
}

export function parseStudentsCSV(csvContent: string): {
  students: ParsedStudent[]
  errors: string[]
} {
  const lines = csvContent.trim().split(/\r?\n/)
  const students: ParsedStudent[] = []
  const errors: string[] = []
  
  // Skip header if present (check if first line contains headers)
  let startLine = 0
  if (lines.length > 0 && lines[0]) {
    const firstLine = lines[0].toLowerCase()
    if (firstLine.includes('id') || firstLine.includes('student') || firstLine.includes('name')) {
      startLine = 1
    }
  }
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue
    
    // Split by comma, handling quoted values
    const columns = parseCSVLine(line)
    
    if (columns.length < 2) {
      errors.push(`Line ${i + 1}: Invalid format - expected at least 2 columns (ID Number, Name)`)
      continue
    }
    
    const id_number = (columns[0] ?? '').trim()
    const name = (columns[1] ?? '').trim()
    const studentErrors: string[] = []
    
    // Validate ID number
    if (!id_number) {
      studentErrors.push('ID Number is required')
    } else if (id_number.length > 50) {
      studentErrors.push('ID Number exceeds maximum length of 50 characters')
    }
    
    if (!name) {
      studentErrors.push('Name is required')
    } else if (name.length > 255) {
      studentErrors.push('Name exceeds maximum length of 255 characters')
    }
    
    if (studentErrors.length > 0) {
      errors.push(`Line ${i + 1} (${id_number || 'empty'}): ${studentErrors.join(', ')}`)
    } else {
      students.push({ id_number, name })
    }
  }
  
  return { students, errors }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

export function downloadCSVTemplate() {
  const headers = ['ID Number', 'Name']
  const exampleRows = [
    ['20240001', 'John Doe'],
    ['20240002', 'Jane Smith'],
    ['20240003', 'Michael Johnson']
  ]
  
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'students_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}