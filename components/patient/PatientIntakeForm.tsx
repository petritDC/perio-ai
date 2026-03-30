'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitIntakeForm } from '@/lib/actions/patient-intake.actions'
import type {
  PatientIntakePayload,
  PersonalInfo,
  MedicalHistoryItem,
  MedicationItem,
  EmergencyContactItem,
  RiskFactors,
} from '@/lib/types/patient-intake'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calcAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const inputCls =
  'w-full rounded-lg border border-[#E4E7EE] bg-white text-slate-800 text-[13px] px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors placeholder:text-slate-400'

const labelCls = 'block text-[12px] text-slate-500 font-medium mb-1'

const sectionCls = 'bg-white rounded-2xl p-6 border border-[#E4E7EE]'

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------
const defaultPersonalInfo: PersonalInfo = {
  fullName: '',
  dateOfBirth: '',
  age: null,
  patientEmail: '',
  insurance: '',
  bloodType: '',
  patientNationalId: '',
  medicalRecordNumber: '',
}

const defaultRiskFactors: RiskFactors = {
  smokingStatus: 'non_smoker',
  cigarettesPerDay: 0,
  diabetesDiagnosed: false,
  hba1c: null,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PatientIntakeForm({ initialData }: { initialData?: PatientIntakePayload }) {
  const router = useRouter()

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(
    initialData?.personalInfo ?? defaultPersonalInfo
  )
  const [allergies, setAllergies] = useState<string[]>(initialData?.allergies ?? [])
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryItem[]>(
    initialData?.medicalHistory ?? []
  )
  const [riskFactors, setRiskFactors] = useState<RiskFactors>(
    initialData?.riskFactors ?? defaultRiskFactors
  )
  const [currentMedications, setCurrentMedications] = useState<MedicationItem[]>(
    initialData?.currentMedications ?? []
  )
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactItem[]>(
    initialData?.emergencyContacts ?? []
  )
  const [hasXRayToUpload, setHasXRayToUpload] = useState(
    initialData?.xRayAvailability.hasXRayToUpload ?? false
  )
  const [doctorNotes, setDoctorNotes] = useState(initialData?.doctorNotes ?? '')
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(
    initialData?.consents.privacyPolicyAccepted ?? false
  )
  const [treatmentConsent, setTreatmentConsent] = useState(
    initialData?.consents.treatmentConsent ?? false
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit() {
    setSubmitError(null)
    setIsSubmitting(true)

    const payload: PatientIntakePayload = {
      submittedAt: new Date().toISOString(),
      formVersion: 'patient_intake_v3',
      personalInfo,
      allergies,
      medicalHistory,
      riskFactors,
      currentMedications,
      emergencyContacts,
      xRayAvailability: { hasXRayToUpload },
      doctorNotes,
      consents: { privacyPolicyAccepted, treatmentConsent },
    }

    try {
      const result = await submitIntakeForm(payload)
      if (!result.success) {
        setSubmitError(result.error ?? 'Submission failed')
        return
      }
      router.push('/patient/portal')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-sora)' }}>
          Patient Intake Form
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Complete all sections to generate a comprehensive periodontal intake record.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Personal Information */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Personal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              className={inputCls}
              placeholder="Full name"
              value={personalInfo.fullName}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Date of Birth</label>
            <input
              type="date"
              className={inputCls}
              value={personalInfo.dateOfBirth}
              onChange={(e) => {
                const dob = e.target.value
                setPersonalInfo((p) => ({ ...p, dateOfBirth: dob, age: calcAge(dob) }))
              }}
            />
          </div>
          <div>
            <label className={labelCls}>Age (auto-calculated)</label>
            <input
              className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`}
              readOnly
              value={personalInfo.age ?? ''}
              placeholder="—"
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              className={inputCls}
              placeholder="patient@email.com"
              value={personalInfo.patientEmail}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, patientEmail: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Insurance</label>
            <input
              className={inputCls}
              placeholder="Insurance provider"
              value={personalInfo.insurance}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, insurance: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Blood Type</label>
            <select
              className={inputCls}
              value={personalInfo.bloodType}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, bloodType: e.target.value }))}
            >
              <option value="">Select blood type</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>National ID</label>
            <input
              className={inputCls}
              placeholder="e.g. 1198765432109"
              value={personalInfo.patientNationalId}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, patientNationalId: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Medical Record Number</label>
            <input
              className={inputCls}
              placeholder="e.g. MRN-2026-001284"
              value={personalInfo.medicalRecordNumber}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, medicalRecordNumber: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Allergies */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Allergies
        </h2>
        <div className="space-y-2">
          {allergies.map((allergy, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className={inputCls}
                placeholder="Allergy"
                value={allergy}
                onChange={(e) => {
                  const next = [...allergies]
                  next[idx] = e.target.value
                  setAllergies(next)
                }}
              />
              <button
                type="button"
                className="text-red-500 text-[12px] font-medium shrink-0 hover:text-red-700 transition-colors"
                onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-[12px] text-teal-600 font-medium hover:text-teal-700 transition-colors"
          onClick={() => setAllergies([...allergies, ''])}
        >
          + Add Allergy
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Medical History */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Medical History
        </h2>
        <div className="space-y-4">
          {medicalHistory.map((item, idx) => (
            <div key={idx} className="border border-[#E4E7EE] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-medium text-slate-500">Entry {idx + 1}</span>
                <button
                  type="button"
                  className="text-red-500 text-[12px] font-medium hover:text-red-700 transition-colors"
                  onClick={() => setMedicalHistory(medicalHistory.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Condition</label>
                  <input
                    className={inputCls}
                    placeholder="Condition"
                    value={item.condition}
                    onChange={(e) =>
                      setMedicalHistory(medicalHistory.map((h, i) => i === idx ? { ...h, condition: e.target.value } : h))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Diagnosed At (YYYY-MM-DD)</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 2019-03-15"
                    value={item.diagnosedAt}
                    onChange={(e) =>
                      setMedicalHistory(medicalHistory.map((h, i) => i === idx ? { ...h, diagnosedAt: e.target.value } : h))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Notes</label>
                  <input
                    className={inputCls}
                    placeholder="Additional notes"
                    value={item.notes}
                    onChange={(e) =>
                      setMedicalHistory(medicalHistory.map((h, i) => i === idx ? { ...h, notes: e.target.value } : h))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-[12px] text-teal-600 font-medium hover:text-teal-700 transition-colors"
          onClick={() => setMedicalHistory([...medicalHistory, { condition: '', diagnosedAt: '', notes: '' }])}
        >
          + Add Medical History Entry
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Risk Factors */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Risk Factors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Smoking Status</label>
            <select
              className={inputCls}
              value={riskFactors.smokingStatus}
              onChange={(e) =>
                setRiskFactors((r) => ({
                  ...r,
                  smokingStatus: e.target.value as RiskFactors['smokingStatus'],
                  cigarettesPerDay: e.target.value !== 'current_smoker' ? 0 : r.cigarettesPerDay,
                }))
              }
            >
              <option value="non_smoker">Non-smoker</option>
              <option value="former_smoker">Former smoker</option>
              <option value="current_smoker">Current smoker</option>
            </select>
          </div>
          {riskFactors.smokingStatus === 'current_smoker' && (
            <div>
              <label className={labelCls}>Cigarettes Per Day</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={riskFactors.cigarettesPerDay}
                onChange={(e) => setRiskFactors((r) => ({ ...r, cigarettesPerDay: Number(e.target.value) }))}
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              id="diabetesDiagnosed"
              type="checkbox"
              className="w-4 h-4 rounded border-[#E4E7EE] text-teal-600 focus:ring-teal-500"
              checked={riskFactors.diabetesDiagnosed}
              onChange={(e) =>
                setRiskFactors((r) => ({
                  ...r,
                  diabetesDiagnosed: e.target.checked,
                  hba1c: e.target.checked ? r.hba1c : null,
                }))
              }
            />
            <label htmlFor="diabetesDiagnosed" className="text-[12px] text-slate-700 font-medium cursor-pointer">
              Diabetes Diagnosed
            </label>
          </div>
          {riskFactors.diabetesDiagnosed && (
            <div>
              <label className={labelCls}>HbA1c (%)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                className={inputCls}
                placeholder="e.g. 6.5"
                value={riskFactors.hba1c ?? ''}
                onChange={(e) =>
                  setRiskFactors((r) => ({
                    ...r,
                    hba1c: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Current Medications */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Current Medications
        </h2>
        <div className="space-y-4">
          {currentMedications.map((med, idx) => (
            <div key={idx} className="border border-[#E4E7EE] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-medium text-slate-500">Medication {idx + 1}</span>
                <button
                  type="button"
                  className="text-red-500 text-[12px] font-medium hover:text-red-700 transition-colors"
                  onClick={() => setCurrentMedications(currentMedications.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    className={inputCls}
                    placeholder="Medication name"
                    value={med.name}
                    onChange={(e) =>
                      setCurrentMedications(currentMedications.map((m, i) => i === idx ? { ...m, name: e.target.value } : m))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Dosage</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 5 mg"
                    value={med.dosage}
                    onChange={(e) =>
                      setCurrentMedications(currentMedications.map((m, i) => i === idx ? { ...m, dosage: e.target.value } : m))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Frequency</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Once daily (morning)"
                    value={med.frequency}
                    onChange={(e) =>
                      setCurrentMedications(currentMedications.map((m, i) => i === idx ? { ...m, frequency: e.target.value } : m))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Prescribed By</label>
                  <input
                    className={inputCls}
                    placeholder="Doctor name"
                    value={med.prescribedBy}
                    onChange={(e) =>
                      setCurrentMedications(currentMedications.map((m, i) => i === idx ? { ...m, prescribedBy: e.target.value } : m))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-[12px] text-teal-600 font-medium hover:text-teal-700 transition-colors"
          onClick={() =>
            setCurrentMedications([...currentMedications, { name: '', dosage: '', frequency: '', prescribedBy: '' }])
          }
        >
          + Add Medication
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Emergency Contacts */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Emergency Contacts
        </h2>
        <div className="space-y-4">
          {emergencyContacts.map((contact, idx) => (
            <div key={idx} className="border border-[#E4E7EE] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-medium text-slate-500">Contact {idx + 1}</span>
                <button
                  type="button"
                  className="text-red-500 text-[12px] font-medium hover:text-red-700 transition-colors"
                  onClick={() => setEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    className={inputCls}
                    placeholder="Contact name"
                    value={contact.name}
                    onChange={(e) =>
                      setEmergencyContacts(emergencyContacts.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    className={inputCls}
                    placeholder="+38344000000"
                    value={contact.phone}
                    onChange={(e) =>
                      setEmergencyContacts(emergencyContacts.map((c, i) => i === idx ? { ...c, phone: e.target.value } : c))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Relationship</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Spouse"
                    value={contact.relationship}
                    onChange={(e) =>
                      setEmergencyContacts(emergencyContacts.map((c, i) => i === idx ? { ...c, relationship: e.target.value } : c))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-[12px] text-teal-600 font-medium hover:text-teal-700 transition-colors"
          onClick={() => setEmergencyContacts([...emergencyContacts, { name: '', phone: '', relationship: '' }])}
        >
          + Add Emergency Contact
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7. X-Ray Availability */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          X-Ray Availability
        </h2>
        <div className="flex items-center gap-3">
          <input
            id="hasXRayToUpload"
            type="checkbox"
            className="w-4 h-4 rounded border-[#E4E7EE] text-teal-600 focus:ring-teal-500"
            checked={hasXRayToUpload}
            onChange={(e) => setHasXRayToUpload(e.target.checked)}
          />
          <label htmlFor="hasXRayToUpload" className="text-[12px] text-slate-700 font-medium cursor-pointer">
            I have X-rays available to upload
          </label>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 8. Additional Notes */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Additional Notes
        </h2>
        <textarea
          className={`${inputCls} min-h-[100px] resize-y`}
          placeholder="Any additional information you'd like your doctor to know…"
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 9. Consents */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls} style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
          Consents
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="privacyPolicy"
              type="checkbox"
              className="w-4 h-4 rounded border-[#E4E7EE] text-teal-600 focus:ring-teal-500"
              checked={privacyPolicyAccepted}
              onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
            />
            <label htmlFor="privacyPolicy" className="text-[12px] text-slate-700 font-medium cursor-pointer">
              I have read and accept the Privacy Policy
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="treatmentConsent"
              type="checkbox"
              className="w-4 h-4 rounded border-[#E4E7EE] text-teal-600 focus:ring-teal-500"
              checked={treatmentConsent}
              onChange={(e) => setTreatmentConsent(e.target.checked)}
            />
            <label htmlFor="treatmentConsent" className="text-[12px] text-slate-700 font-medium cursor-pointer">
              I consent to treatment and data processing
            </label>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-[12px] text-red-600 font-medium">{submitError}</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Submit */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex justify-end pb-8">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {isSubmitting ? 'Submitting…' : 'Submit Form'}
        </button>
      </div>
    </div>
  )
}
