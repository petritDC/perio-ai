'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inviteStaff } from '@/lib/actions/staff.actions'

type StaffInviteFormProps = {
  variant?: 'default' | 'modal'
  onSuccess?: () => void
  onCancel?: () => void
}

export default function StaffInviteForm({
  variant = 'default',
  onSuccess,
  onCancel,
}: StaffInviteFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await inviteStaff(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        if (onSuccess) {
          router.refresh()
          onSuccess()
        } else {
          setSuccess(true)
          setTimeout(() => router.push('/staff'), 1500)
        }
      }
    })
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-8 text-center">
        <p className="text-[#0D9488] font-medium">Invitation sent successfully.</p>
        <p className="text-sm text-[#717182] mt-1">Redirecting to staff list…</p>
      </div>
    )
  }

  const fields = (
    <>
      {error ? (
        <p className="text-sm text-[#d4183d] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" placeholder="Dr. Jane Doe" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="jane@clinic.com" required />
      </div>

      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select name="role" defaultValue="dentist">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="dentist">Dentist</SelectItem>
            <SelectItem value="hygienist">Hygienist</SelectItem>
            <SelectItem value="receptionist">Receptionist</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )

  if (variant === 'modal') {
    return (
      <form action={handleSubmit} className="space-y-6">
        <div className="space-y-4">{fields}</div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#3BA39B] hover:bg-[#2F8D86] text-white"
          >
            {isPending ? 'Sending…' : 'Send Invitation'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) onCancel()
              else router.back()
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-md">
      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        {fields}
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#0D9488] hover:bg-[#0B7C71] text-white"
        >
          {isPending ? 'Sending…' : 'Send Invitation'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
