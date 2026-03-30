import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatient } from '@/lib/queries/patient.queries'
import { PatientForm } from '@/components/patients/PatientForm'
import { ChevronLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPatientPage({ params }: PageProps) {
  const { id } = await params
  const patient = await getPatient(id)
  if (!patient) notFound()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href={`/patients/${id}`} className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to profile
      </Link>
      <h1 className="text-[26px] font-semibold text-slate-900 tracking-tight mb-6" style={{ fontFamily: 'var(--font-sora)' }}>
        Edit Patient
      </h1>
      <PatientForm patient={patient} />
    </div>
  )
}
