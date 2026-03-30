import Link from 'next/link'
import { Suspense } from 'react'
import { getPatients, getPendingIntakeSubmissions } from '@/lib/queries/patient.queries'
import { PatientTable } from '@/components/patients/PatientTable'
import { PatientFilters } from '@/components/patients/PatientFilters'
import { PendingIntakeTable } from '@/components/patients/PendingIntakeTable'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; sort?: string; page?: string }>
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const [{ data: patients, count }, pendingIntakes] = await Promise.all([
    getPatients({ search: params.search, status: params.status, sort: params.sort, page, limit: 20 }),
    getPendingIntakeSubmissions(),
  ])
  const totalPages = Math.ceil(count / 20)

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
            Patients
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{count} total patients</p>
        </div>
        <Link href="/patients/new">
          <Button className="bg-teal-600 hover:bg-teal-700 h-9 px-4 text-[13px] font-semibold" style={{ fontFamily: 'var(--font-sora)' }}>
            <UserPlus className="w-4 h-4 mr-1.5" /> New patient
          </Button>
        </Link>
      </div>

      {/* Pending intake submissions */}
      {pendingIntakes.length > 0 && (
        <div className="bg-white rounded-2xl" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid #F59E0B44' }}>
          <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
              {pendingIntakes.length}
            </span>
            <h2 className="text-[13px] font-semibold text-amber-800" style={{ fontFamily: 'var(--font-sora)' }}>
              Pending Intake Review
            </h2>
            <p className="text-[12px] text-amber-600 ml-1">— review and admit patients from self-submitted intake forms</p>
          </div>
          <PendingIntakeTable submissions={pendingIntakes as any} />
        </div>
      )}

      {/* Active patients */}
      <div className="bg-white rounded-2xl" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <div className="p-4 border-b border-[#E4E7EE]">
          <Suspense>
            <PatientFilters />
          </Suspense>
        </div>
        <PatientTable patients={patients} />
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E4E7EE]">
            <p className="text-[12px] text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/patients?page=${page - 1}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-[12px]">← Previous</Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/patients?page=${page + 1}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-[12px]">Next →</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
