export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type AppointmentType =
  | 'consultation'
  | 'cleaning'
  | 'periodontal_treatment'
  | 'follow_up'
  | 'emergency'
  | 'other'

export interface Appointment {
  id: string
  patientId: string
  providerId: string
  title: string
  appointmentType: AppointmentType
  status: AppointmentStatus
  startTime: string   // ISO8601
  endTime: string     // ISO8601
  notes: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface AppointmentWithNames extends Appointment {
  patientName: string | null
  providerName: string | null
}

export interface WeekSlot {
  date: string   // YYYY-MM-DD
  appointments: AppointmentWithNames[]
}
