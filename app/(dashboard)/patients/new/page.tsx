import Link from 'next/link'
import { PatientForm } from '@/components/patients/PatientForm'
import { ChevronLeft } from 'lucide-react'

export default function NewPatientPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to patients
      </Link>
      <h1 className="text-[26px] font-semibold text-slate-900 tracking-tight mb-6" style={{ fontFamily: 'var(--font-sora)' }}>
        New Patient
      </h1>
      <PatientForm />
    </div>
  )
}
