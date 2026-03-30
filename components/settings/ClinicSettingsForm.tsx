'use client'

import { useTransition } from 'react'
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
import { updateClinicProfile } from '@/lib/actions/clinic.actions'
import type { ClinicProfile } from '@/lib/types/staff'

const TIMEZONES = [
  'Europe/Tirane',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
]

const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60]

export default function ClinicSettingsForm({ clinic }: { clinic: ClinicProfile | null }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateClinicProfile(formData)
      if (!result?.error) {
        router.refresh()
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#030213]">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Clinic Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={clinic?.name ?? ''}
              placeholder="My Dental Clinic"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={clinic?.phone ?? ''}
              placeholder="+355 XX XXX XXXX"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={clinic?.address ?? ''}
            placeholder="Street, City, Country"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={clinic?.email ?? ''}
              placeholder="info@clinic.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              defaultValue={clinic?.website ?? ''}
              placeholder="https://clinic.com"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#030213]">Working Hours</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="workingHoursStart">Opens At</Label>
            <Input
              id="workingHoursStart"
              name="workingHoursStart"
              type="time"
              defaultValue={clinic?.workingHoursStart ?? '08:00'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workingHoursEnd">Closes At</Label>
            <Input
              id="workingHoursEnd"
              name="workingHoursEnd"
              type="time"
              defaultValue={clinic?.workingHoursEnd ?? '18:00'}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slot Duration</Label>
            <Select name="slotDurationMinutes" defaultValue={String(clinic?.slotDurationMinutes ?? 30)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Select name="timezone" defaultValue={clinic?.timezone ?? 'Europe/Tirane'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
    </form>
  )
}
