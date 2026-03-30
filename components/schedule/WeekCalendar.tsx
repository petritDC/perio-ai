'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { WeekSlot, AppointmentWithNames } from '@/lib/types/appointment'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-teal-100 text-teal-800 border-teal-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200',
}

function prevMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

function nextMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export default function WeekCalendar({
  weekStart,
  slots,
}: {
  weekStart: string
  slots: WeekSlot[]
}) {
  const router = useRouter()

  return (
    <div>
      {/* Week nav */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/schedule?week=${prevMonday(weekStart)}`)}
        >
          ← Prev
        </Button>
        <span className="text-sm font-medium text-[#030213]">
          Week of {formatDate(weekStart)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/schedule?week=${nextMonday(weekStart)}`)}
        >
          Next →
        </Button>
        <div className="ml-auto">
          <Button asChild size="sm" className="bg-[#0D9488] hover:bg-[#0B7C71] text-white">
            <Link href="/schedule/new">+ New Appointment</Link>
          </Button>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-2">
        {slots.map((slot) => (
          <div key={slot.date} className="min-h-[200px]">
            <div className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2 pb-1 border-b border-[#E4E7EE]">
              {formatDate(slot.date)}
            </div>
            <div className="space-y-1">
              {slot.appointments.length === 0 ? (
                <p className="text-xs text-[#717182] italic pt-2">No appointments</p>
              ) : (
                slot.appointments.map((appt) => (
                  <Link key={appt.id} href={`/schedule/${appt.id}/edit`}>
                    <div
                      className={`text-xs rounded-md border px-2 py-1.5 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[appt.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                      <div className="font-medium truncate">{appt.title}</div>
                      <div className="text-[10px] opacity-75">
                        {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                      </div>
                      {appt.patientName ? (
                        <div className="text-[10px] opacity-75 truncate">{appt.patientName}</div>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
