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
import { updateStaffMember } from '@/lib/actions/staff.actions'
import type { StaffMember } from '@/lib/types/staff'

export default function StaffEditForm({ member }: { member: StaffMember }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('id', member.id)
    startTransition(async () => {
      const result = await updateStaffMember(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#030213]">Profile</h2>

        {error ? (
          <p className="text-sm text-[#d4183d] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={member.fullName ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select name="role" defaultValue={member.role}>
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
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select name="status" defaultValue={member.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#0D9488] hover:bg-[#0B7C71] text-white"
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  )
}
