export interface MedicalHistoryItem {
  condition: string
  diagnosedAt: string
  notes: string
}

export interface MedicationItem {
  name: string
  dosage: string
  frequency: string
  prescribedBy: string
}

export interface EmergencyContactItem {
  name: string
  phone: string
  relationship: string
}

export interface XRayAvailability {
  hasXRayToUpload: boolean
}

export interface RiskFactors {
  smokingStatus: 'non_smoker' | 'former_smoker' | 'current_smoker'
  cigarettesPerDay: number
  diabetesDiagnosed: boolean
  hba1c: number | null
}

export interface PersonalInfo {
  fullName: string
  dateOfBirth: string
  age: number | null
  patientEmail: string
  insurance: string
  bloodType: string
  patientNationalId: string
  medicalRecordNumber: string
}

export interface PatientIntakePayload {
  submittedAt?: string
  formVersion?: string
  personalInfo: PersonalInfo
  allergies: string[]
  medicalHistory: MedicalHistoryItem[]
  riskFactors: RiskFactors
  currentMedications: MedicationItem[]
  emergencyContacts: EmergencyContactItem[]
  xRayAvailability: XRayAvailability
  doctorNotes: string
  consents: {
    privacyPolicyAccepted: boolean
    treatmentConsent: boolean
  }
}
