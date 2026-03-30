export type PatientStatus = 'active' | 'inactive' | 'archived'
export type DocumentCategory = 'general' | 'xray' | 'report' | 'consent' | 'referral' | 'other' | 'radiology'

export interface Patient {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  date_of_birth: string | null
  email: string | null
  phone: string | null
  address: string | null
  insurance_provider: string | null
  blood_type: string | null
  national_id: string | null
  medical_record_no: string | null
  status: PatientStatus
  intake_submission_id: string | null
  notes: string
}

export interface PatientDocument {
  id: string
  patient_id: string
  uploaded_by: string
  created_at: string
  file_name: string
  category: DocumentCategory
  file_path: string
  mime_type: string | null
  file_size: number | null
}

export interface PatientListItem {
  id: string
  full_name: string
  date_of_birth: string | null
  email: string | null
  phone: string | null
  status: PatientStatus
  created_at: string
  medical_record_no: string | null
}
