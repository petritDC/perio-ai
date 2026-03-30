'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deletePatient } from '@/lib/actions/patient.actions'

export function DeletePatientButton({ patientId }: { patientId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      await deletePatient(patientId)
      router.push('/patients')
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-red-600 font-medium" style={{ fontFamily: 'var(--font-sora)' }}>Delete this patient?</span>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="h-8 px-3 text-[12px] bg-red-600 hover:bg-red-700 text-white"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {isPending ? 'Deleting…' : 'Yes, delete'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirm(false)}
          className="h-8 text-[12px] border-[#E4E7EE]"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirm(true)}
      className="h-8 text-[12px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
      style={{ fontFamily: 'var(--font-sora)' }}
    >
      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
    </Button>
  )
}
