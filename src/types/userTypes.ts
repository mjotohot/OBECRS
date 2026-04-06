export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  name: string
  role: 'Faculty' | 'Chairperson' | 'Admin'
}
