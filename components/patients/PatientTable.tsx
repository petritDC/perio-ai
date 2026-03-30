'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deletePatient, bulkDeletePatients } from '@/lib/actions/patient.actions'
import type { PatientListItem } from '@/lib/types/patient'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-teal-50 text-teal-700 border border-teal-200',
    inactive: 'bg-slate-100 text-slate-500',
    archived: 'bg-amber-50 text-amber-700 border border-amber-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${styles[status] ?? styles.inactive}`} style={{ fontFamily: 'var(--font-sora)' }}>
      {status}
    </span>
  )
}

export function PatientTable({ patients }: { patients: PatientListItem[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const allSelected = patients.length > 0 && selected.size === patients.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(patients.map((p) => p.id)))
  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  function handleDelete(id: string) {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setConfirmDelete(null)
    startTransition(async () => {
      await deletePatient(id)
      router.refresh()
    })
  }

  function handleBulkDelete() {
    startTransition(async () => {
      await bulkDeletePatients([...selected])
      setSelected(new Set())
      router.refresh()
    })
  }

  if (patients.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-[14px]">No patients found.</div>
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border-b border-red-100">
          <span className="text-[13px] text-red-700 font-medium" style={{ fontFamily: 'var(--font-sora)' }}>
            {selected.size} patient{selected.size > 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="h-7 px-3 text-[11px] bg-red-600 hover:bg-red-700 text-white"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            className="h-7 px-3 text-[11px] text-slate-500"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E4E7EE]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer"
                />
              </th>
              {['Name', 'MRN', 'Email', 'Phone', 'Status', 'Added', ''].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3" style={{ fontFamily: 'var(--font-sora)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#E4E7EE] hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => router.push(`/patients/${p.id}`)}
              >
                <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-teal-600 group-hover:text-teal-700" style={{ fontFamily: 'var(--font-sora)' }}>
                    {p.full_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-500 font-mono">{p.medical_record_no ?? '—'}</td>
                <td className="px-4 py-3 text-[13px] text-slate-600">{p.email ?? '—'}</td>
                <td className="px-4 py-3 text-[13px] text-slate-600">{p.phone ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-[12px] text-slate-400">
                  {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 w-20 text-right" onClick={(e) => e.stopPropagation()}>
                  {confirmDelete === p.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="h-6 px-2 text-[10px] bg-red-600 hover:bg-red-700 text-white"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(null)}
                        className="h-6 px-2 text-[10px]"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(p.id)}
                      disabled={isPending}
                      className="h-6 w-6 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
