'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPatient, updatePatient } from '@/lib/actions/patient.actions'
import type { Patient } from '@/lib/types/patient'

const bloodTypes = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

interface PatientFormProps {
  patient?: Patient
}

export function PatientForm({ patient }: PatientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const data = {
      full_name: form.get('full_name') as string,
      date_of_birth: (form.get('date_of_birth') as string) || null,
      email: (form.get('email') as string) || '',
      phone: (form.get('phone') as string) || null,
      address: (form.get('address') as string) || null,
      insurance_provider: (form.get('insurance_provider') as string) || null,
      blood_type: (form.get('blood_type') as string) || null,
      national_id: (form.get('national_id') as string) || null,
      medical_record_no: (form.get('medical_record_no') as string) || null,
      notes: (form.get('notes') as string) || '',
    }

    const result = patient
      ? await updatePatient(patient.id, data)
      : await createPatient(data)

    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    if ('id' in result) {
      router.push(`/patients/${result.id}`)
    } else {
      router.push(`/patients/${patient!.id}`)
    }
    router.refresh()
  }

  const field = (label: string, name: string, type = 'text', defaultValue?: string | null) => (
    <div>
      <Label htmlFor={name} className="text-[12px] text-slate-500 font-medium">{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        className="mt-1 h-9 text-[13px] border-[#E4E7EE]"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {field('Full Name *', 'full_name', 'text', patient?.full_name)}
          {field('Date of Birth', 'date_of_birth', 'date', patient?.date_of_birth)}
          {field('Email', 'email', 'email', patient?.email)}
          {field('Phone', 'phone', 'tel', patient?.phone)}
          <div>
            <Label htmlFor="blood_type" className="text-[12px] text-slate-500 font-medium">Blood Type</Label>
            <select
              id="blood_type"
              name="blood_type"
              defaultValue={patient?.blood_type ?? ''}
              className="mt-1 w-full h-9 rounded-lg border border-[#E4E7EE] bg-white px-3 text-[13px] text-slate-800"
            >
              {bloodTypes.map((bt) => <option key={bt} value={bt}>{bt || 'Unknown'}</option>)}
            </select>
          </div>
          {field('National ID', 'national_id', 'text', patient?.national_id)}
          {field('Medical Record No.', 'medical_record_no', 'text', patient?.medical_record_no)}
          {field('Insurance Provider', 'insurance_provider', 'text', patient?.insurance_provider)}
        </div>
        <div className="mt-4">
          {field('Address', 'address', 'text', patient?.address)}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-sora)' }}>Clinical Notes</h2>
        <textarea
          name="notes"
          defaultValue={patient?.notes ?? ''}
          rows={4}
          placeholder="Clinical notes visible to staff only…"
          className="w-full rounded-lg border border-[#E4E7EE] bg-white px-3 py-2 text-[13px] text-slate-800 resize-none"
        />
      </div>

      {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 h-10 px-6 text-[13px] font-semibold" style={{ fontFamily: 'var(--font-sora)' }}>
          {loading ? 'Saving…' : patient ? 'Save changes' : 'Create patient'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} className="h-10 px-6 text-[13px] text-slate-500">
          Cancel
        </Button>
      </div>
    </form>
  )
}
