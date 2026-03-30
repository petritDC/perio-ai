import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getDashboardStats, getRecentActivity } from '@/lib/queries/dashboard.queries'
import StatCard from '@/components/dashboard/StatCard'

const ACTIVITY_ICONS: Record<string, string> = {
  appointment: '📅',
  chart: '🦷',
  diagnosis: '✦',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function DashboardPage() {
  const [session, stats, activity] = await Promise.all([
    getSession(),
    getDashboardStats(),
    getRecentActivity(),
  ])

  const isAdmin = session?.role === 'admin'
  const isProvider = session?.role === 'dentist' || session?.role === 'hygienist'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213]">
          {session?.fullName ? `Welcome back, ${session.fullName.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-sm text-[#717182] mt-1 capitalize">{session?.role ?? 'Staff'} view</p>
      </div>

      {/* Primary stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Today's Appointments"
          value={stats.todayAppointments}
          sub={`${stats.upcomingAppointments} upcoming`}
          accent
          href="/schedule"
        />
        <StatCard
          label="Total Patients"
          value={stats.totalPatients}
          sub={`${stats.activePatients} active`}
          href="/patients"
        />
        <StatCard
          label="Charts"
          value={stats.finalizedCharts}
          sub={`${stats.draftCharts} drafts`}
          href="/charting"
        />
        <StatCard
          label="AI Diagnoses"
          value={stats.totalDiagnoses}
          href="/diagnostics"
        />
      </div>

      {/* Secondary row — admin/provider only */}
      {(isAdmin || isProvider) ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <StatCard
              label="Active Staff"
              value={stats.activeStaff}
              href="/settings/staff"
            />
          ) : null}
          <StatCard
            label="Finalized Charts"
            value={stats.finalizedCharts}
            sub="ready for reports"
            href="/reports"
          />
          <StatCard
            label="Pending Charts"
            value={stats.draftCharts}
            sub="need completion"
            href="/charting"
          />
        </div>
      ) : null}

      {/* Recent activity + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-5">
          <h2 className="text-sm font-semibold text-[#030213] mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-[#717182] italic">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{ACTIVITY_ICONS[item.type] ?? '·'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#030213] truncate">{item.label}</p>
                  </div>
                  <span className="text-xs text-[#717182] shrink-0">{timeAgo(item.time)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-5">
          <h2 className="text-sm font-semibold text-[#030213] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/schedule/new"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#F7F9FC] border border-[#E4E7EE] transition-colors"
            >
              <span>📅</span> Book Appointment
            </Link>
            <Link
              href="/patients"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#F7F9FC] border border-[#E4E7EE] transition-colors"
            >
              <span>👤</span> View Patients
            </Link>
            <Link
              href="/charting"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#F7F9FC] border border-[#E4E7EE] transition-colors"
            >
              <span>🦷</span> Charting
            </Link>
            <Link
              href="/diagnostics"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#F7F9FC] border border-[#E4E7EE] transition-colors"
            >
              <span>✦</span> AI Diagnostics
            </Link>
            <Link
              href="/reports"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#F7F9FC] border border-[#E4E7EE] transition-colors"
            >
              <span>↓</span> Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
