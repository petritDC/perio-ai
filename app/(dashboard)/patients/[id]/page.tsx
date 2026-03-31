import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatientWithIntake, getPatientDocuments } from '@/lib/queries/patient.queries'
import { getPatientTreatmentPlans } from '@/lib/queries/treatment-plan.queries'
import { getPatientRadiologyImages } from '@/lib/queries/radiology.queries'
import { getPatientDiagnosesFull } from '@/lib/queries/diagnosis.queries'
import { getPatientCharts } from '@/lib/queries/charting.queries'
import { PatientProfileTabs } from '@/components/patients/PatientProfileTabs'
import { DocumentUpload } from '@/components/patients/DocumentUpload'
import { TreatmentPlansPanel } from '@/components/patients/TreatmentPlansPanel'
import RadiologyViewer from '@/components/radiology/RadiologyViewer'
import { PatientDiagnosisHistory } from '@/components/patients/PatientDiagnosisHistory'
import ChartSummaryCard from '@/components/charting/ChartSummaryCard'
import { Button } from '@/components/ui/button'
import { DeletePatientButton } from '@/components/patients/DeletePatientButton'
import { ChevronLeft, Pencil } from 'lucide-react'
import { BLDiagnosisPanel } from '@/components/patients/BLDiagnosisPanel'
import { AITeethDataPanel } from '@/components/patients/AITeethDataPanel'
import { BLRadiologyOverlay } from '@/components/radiology/BLRadiologyOverlay'
import { computeBLDiagnosis } from '@/lib/services/bl-diagnosis.service'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import blRaw from '@/lib/json/mock_BL.json'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PatientProfilePage({ params }: PageProps) {
  const { id } = await params
  const [patientWithIntake, documents, treatmentPlans, radiologyImages, diagnosisList, charts, session] = await Promise.all([
    getPatientWithIntake(id),
    getPatientDocuments(id),
    getPatientTreatmentPlans(id),
    getPatientRadiologyImages(id),
    getPatientDiagnosesFull(id),
    getPatientCharts(id),
    getSession(),
  ])

  const diagnoses = diagnosisList

  if (!patientWithIntake) notFound()

  const { intake, ...patient } = patientWithIntake

  const riskFactors = intake?.risk_factors ?? null
  const blDiagnosis = computeBLDiagnosis(blRaw, riskFactors)

  const firstImage = radiologyImages.find((img) => img.mimeType?.startsWith('image/')) ?? null
  let firstImageUrl: string | null = null
  if (firstImage) {
    const supabase = await createClient()
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(firstImage.filePath, 3600)
    firstImageUrl = data?.signedUrl ?? null
  }

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/patients" className="text-slate-400 hover:text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
              {patient.full_name}
            </h1>
            <p className="text-[13px] text-slate-500">
              {age ? `${age} years old` : ''}
              {patient.medical_record_no ? ` · MRN: ${patient.medical_record_no}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DeletePatientButton patientId={id} />
          <Link href={`/patients/${id}/edit`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] border-[#E4E7EE]" style={{ fontFamily: 'var(--font-sora)' }}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Email', value: patient.email ?? '—' },
          { label: 'Phone', value: patient.phone ?? '—' },
          { label: 'Blood Type', value: patient.blood_type ?? '—' },
          { label: 'Insurance', value: patient.insurance_provider ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-sora)' }}>{label}</p>
            <p className="text-[14px] text-slate-800 font-medium truncate">{value}</p>
          </div>
        ))}
      </div>

      <PatientProfileTabs
        tabContent={{
          overview: (
            <div className="space-y-4">
              {patient.notes && (
                <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                  <h3 className="text-[14px] font-semibold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-sora)' }}>Clinical Notes</h3>
                  <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{patient.notes}</p>
                </div>
              )}

              {intake && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Allergies */}
                  {(intake.allergies as string[]).length > 0 && (
                    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                      <h3 className="text-[13px] font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-sora)' }}>Allergies</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(intake.allergies as string[]).map((a: string, i: number) => (
                          <span key={i} className="bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {intake.risk_factors && (
                    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                      <h3 className="text-[13px] font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-sora)' }}>Risk Factors</h3>
                      <div className="space-y-1 text-[12px] text-slate-600">
                        <p>Smoking: <span className="font-medium text-slate-800 capitalize">{intake.risk_factors?.smokingStatus?.replace('_', ' ')}</span></p>
                        <p>Diabetes: <span className="font-medium text-slate-800">{intake.risk_factors?.diabetesDiagnosed ? 'Yes' : 'No'}</span>
                          {intake.risk_factors?.hba1c ? <span className="text-slate-500"> · HbA1c {intake.risk_factors.hba1c}%</span> : null}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Medical History */}
                  {(intake.medical_history as any[]).length > 0 && (
                    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                      <h3 className="text-[13px] font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-sora)' }}>Medical History</h3>
                      <div className="space-y-2">
                        {(intake.medical_history as any[]).map((h: any, i: number) => (
                          <div key={i}>
                            <p className="text-[12px] font-semibold text-slate-800">{h.condition}</p>
                            {h.notes && <p className="text-[11px] text-slate-500">{h.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Medications */}
                  {(intake.current_medications as any[]).length > 0 && (
                    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                      <h3 className="text-[13px] font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-sora)' }}>Current Medications</h3>
                      <div className="space-y-2">
                        {(intake.current_medications as any[]).map((m: any, i: number) => (
                          <div key={i}>
                            <p className="text-[12px] font-semibold text-slate-800">{m.name} <span className="font-normal text-slate-500">{m.dosage}</span></p>
                            <p className="text-[11px] text-slate-500">{m.frequency}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <ChartSummaryCard
                patientId={id}
                charts={charts}
                canCreateChart={['admin', 'dentist', 'hygienist'].includes(session?.role ?? '')}
              />
            </div>
          ),
          documents: (
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-[14px] font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>Documents</h3>
              <DocumentUpload patientId={id} documents={documents} />
            </div>
          ),
          charting: (
            <div className="space-y-4">
              <ChartSummaryCard
                patientId={id}
                charts={charts}
                canCreateChart={['admin', 'dentist', 'hygienist'].includes(session?.role ?? '')}
              />
              <AITeethDataPanel teeth={blRaw.teeth} />
            </div>
          ),
          radiology: (
            <div className="space-y-4">
              <BLRadiologyOverlay imageUrl={firstImageUrl} teeth={blRaw.teeth} />
              <RadiologyViewer key="radiology" patientId={id} initialImages={radiologyImages} />
            </div>
          ),
          diagnostics: (
            <div className="space-y-4">
              <BLDiagnosisPanel diagnosis={blDiagnosis} teeth={blRaw.teeth} />
              <PatientDiagnosisHistory key="diagnostics" diagnoses={diagnoses} />
            </div>
          ),
          treatment: <TreatmentPlansPanel key="treatment" patientId={id} initialPlans={treatmentPlans} />,
        }}
      />
    </div>
  )
}
