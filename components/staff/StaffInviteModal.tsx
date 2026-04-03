'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import StaffInviteForm from '@/components/settings/StaffInviteForm'

type StaffInviteModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StaffInviteModal({ open, onOpenChange }: StaffInviteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/35 supports-backdrop-filter:backdrop-blur-md" />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[22px] border border-[#D7E0EC] bg-white p-6 text-sm shadow-[var(--shadow-card)] outline-none sm:max-w-md',
            'duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <DialogTitle
              className="text-[22px] font-semibold tracking-[-0.02em] text-[#1F2A44]"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Invite Team Member
            </DialogTitle>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  className="shrink-0 rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#334155]"
                  size="icon-sm"
                />
              }
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
          <StaffInviteForm
            variant="modal"
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
