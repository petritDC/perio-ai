'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { admitPatient } from '@/lib/actions/patient.actions'
import { Button } from '@/components/ui/button'

interface PendingSubmission {
  id: string
  submitted_at: string
  personal_info: Record<string, string>
  allergies: string[]
  risk_factors: Record<string, unknown>
}

export function PendingIntakeTable({ submissions }: { submissions: PendingSubmission[] }) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-[13px]">
        No pending intake submissions.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E4E7EE]">
            {['Name', 'Email', 'Date of Birth', 'Submitted', 'Action'].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3" style={{ fontFamily: 'var(--font-sora)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <PendingRow key={s.id} submission={s} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PendingRow({ submission: s }: { submission: PendingSubmission }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdmit() {
    startTransition(async () => {
      const result = await admitPatient(s.id)
      if ('patientId' in result) {
        router.push(`/patients/${result.patientId}`)
      }
    })
  }

  return (
    <tr className="border-b border-[#E4E7EE] hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-[13px] font-semibold text-slate-800" style={{ fontFamily: 'var(--font-sora)' }}>
        {s.personal_info?.fullName ?? '—'}
      </td>
      <td className="px-4 py-3 text-[13px] text-slate-600">{s.personal_info?.patientEmail ?? '—'}</td>
      <td className="px-4 py-3 text-[13px] text-slate-600">{s.personal_info?.dateOfBirth ?? '—'}</td>
      <td className="px-4 py-3 text-[12px] text-slate-400">
        {new Date(s.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3">
        <Button
          size="sm"
          onClick={handleAdmit}
          disabled={isPending}
          className="h-7 px-3 text-[11px] bg-teal-600 hover:bg-teal-700 text-white"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {isPending ? 'Admitting…' : 'Admit Patient'}
        </Button>
      </td>
    </tr>
  )
}
