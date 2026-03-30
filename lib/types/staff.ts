export type StaffRole = 'admin' | 'dentist' | 'hygienist' | 'receptionist'
export type StaffStatus = 'active' | 'inactive' | 'pending'

export interface StaffMember {
  id: string
  email: string
  fullName: string | null
  role: StaffRole
  status: StaffStatus
  createdAt: string
}

export interface StaffAvailability {
  id: string
  userId: string
  dayOfWeek: number  // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string  // "HH:MM"
  endTime: string    // "HH:MM"
  isAvailable: boolean
}

export interface ClinicProfile {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoPath: string | null
  timezone: string
  workingHoursStart: string
  workingHoursEnd: string
  slotDurationMinutes: number
}
