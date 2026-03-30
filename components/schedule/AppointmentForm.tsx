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
import { createAppointment, updateAppointment, cancelAppointment } from '@/lib/actions/appointment.actions'
import type { AppointmentWithNames } from '@/lib/types/appointment'
import type { StaffMember } from '@/lib/types/staff'
import type { PatientListItem } from '@/lib/types/patient'

const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'periodontal_treatment', label: 'Periodontal Treatment' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
]

const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

export default function AppointmentForm({
  appointment,
  providers,
  patients,
}: {
  appointment?: AppointmentWithNames
  providers: StaffMember[]
  patients: PatientListItem[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const router = useRouter()
  const isEdit = !!appointment

  async function handleSubmit(formData: FormData) {
    setError(null)
    setWarning(null)
    if (isEdit) formData.set('id', appointment!.id)

    startTransition(async () => {
      const result = isEdit
        ? await updateAppointment(formData)
        : await createAppointment(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        if ((result as any).availabilityWarning) {
          setWarning((result as any).availabilityWarning)
        }
        router.push('/schedule')
      }
    })
  }

  async function handleCancel() {
    if (!appointment) return
    startTransition(async () => {
      const result = await cancelAppointment(appointment.id)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/schedule')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-xl">
      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        {error ? (
          <p className="text-sm text-[#d4183d] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}
        {warning ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {warning}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={appointment?.title ?? ''}
            placeholder="e.g. Periodontal Exam"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select name="patientId" defaultValue={appointment?.patientId ?? ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName ?? p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select name="providerId" defaultValue={appointment?.providerId ?? ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName ?? p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select name="appointmentType" defaultValue={appointment?.appointmentType ?? 'consultation'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPOINTMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startTime">Start</Label>
            <Input
              id="startTime"
              name="startTime"
              type="datetime-local"
              defaultValue={appointment?.startTime ? appointment.startTime.slice(0, 16) : ''}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endTime">End</Label>
            <Input
              id="endTime"
              name="endTime"
              type="datetime-local"
              defaultValue={appointment?.endTime ? appointment.endTime.slice(0, 16) : ''}
              required
            />
          </div>
        </div>

        {isEdit ? (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select name="status" defaultValue={appointment?.status ?? 'scheduled'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            name="notes"
            defaultValue={appointment?.notes ?? ''}
            placeholder="Optional notes"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#0D9488] hover:bg-[#0B7C71] text-white"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Book Appointment'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        {isEdit && appointment?.status !== 'cancelled' ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleCancel}
            className="ml-auto"
          >
            Cancel Appointment
          </Button>
        ) : null}
      </div>
    </form>
  )
}
