export type UserRole = 'admin' | 'dentist' | 'hygienist' | 'receptionist' | 'patient'

export interface UserSession {
  id: string
  email: string
  role: UserRole
  fullName: string | null
}
