'use client'

import { useTransition, useState } from 'react'
import { updateProfile } from '@/lib/actions/profile.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserSession } from '@/lib/types/auth'

export default function ProfileForm({ session }: { session: UserSession }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if ('error' in result) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-md">
      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        {error && (
          <p className="text-sm text-[#d4183d] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">Profile updated successfully.</p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={session.email} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed" />
          <p className="text-[11px] text-slate-400">Email cannot be changed.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={session.fullName ?? ''}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={session.role} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed capitalize" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        <p className="text-[13px] font-semibold text-slate-700" style={{ fontFamily: 'var(--font-sora)' }}>
          Change Password
        </p>
        <p className="text-[12px] text-slate-400 -mt-2">Leave blank to keep your current password.</p>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" name="newPassword" type="password" placeholder="Min. 8 characters" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repeat new password" />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="bg-[#0D9488] hover:bg-[#0B7C71] text-white"
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
