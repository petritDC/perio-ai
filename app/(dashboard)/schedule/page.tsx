import { getWeekAppointments } from '@/lib/queries/appointment.queries'
import WeekCalendar from '@/components/schedule/WeekCalendar'

function getMondayOfWeek(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date()
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const weekStart = getMondayOfWeek(week)
  const slots = await getWeekAppointments(weekStart)

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        Schedule
      </h1>
      <WeekCalendar weekStart={weekStart} slots={slots} />
    </div>
  )
}
