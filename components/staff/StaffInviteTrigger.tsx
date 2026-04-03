'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StaffInviteModal } from '@/components/staff/StaffInviteModal'

export function StaffInviteTrigger() {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  return (
    <>
      <Button
        type="button"
        className="h-11 rounded-full bg-[#3BA39B] px-5 text-[15px] font-semibold text-white hover:bg-[#2F8D86]"
        style={{ fontFamily: 'var(--font-sora)' }}
        onClick={() => {
          setFormKey((k) => k + 1)
          setOpen(true)
        }}
      >
        <UserPlus className="size-4" />
        Invite Team Member
      </Button>
      <StaffInviteModal key={formKey} open={open} onOpenChange={setOpen} />
    </>
  )
}
