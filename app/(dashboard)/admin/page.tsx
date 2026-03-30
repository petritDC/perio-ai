import { requireRole } from '@/lib/auth/session'
import { getStaffRosterStats, getPendingInvites } from '@/lib/queries/admin.queries'
import { revokeInvite } from '@/lib/actions/staff.actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  dentist: 'Dentist',
  hygienist: 'Hygienist',
  receptionist: 'Receptionist',
}

export default async function AdminPage() {
  await requireRole(['admin'])

  const [roster, invites] = await Promise.all([
    getStaffRosterStats(),
    getPendingInvites(),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213]">
          Admin Overview
        </h1>
        <Button asChild size="sm" className="bg-[#0D9488] hover:bg-[#0B7C71] text-white">
          <Link href="/settings/staff/invite">Invite Staff</Link>
        </Button>
      </div>

      {/* Roster stats */}
      <div>
        <h2 className="text-sm font-semibold text-[#717182] uppercase tracking-wider mb-3">
          Staff Roster
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div
              key={role}
              className="bg-white rounded-xl border border-[#E4E7EE] p-4"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <p className="text-xs text-[#717182] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-3xl font-bold font-[family-name:var(--font-sora)] text-[#030213]">
                {roster.byRole[role] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-6">
          <div className="text-sm text-[#717182]">
            Total staff: <span className="font-semibold text-[#030213]">{roster.total}</span>
          </div>
          {Object.entries(roster.byStatus).map(([status, count]) => (
            <div key={status} className="text-sm text-[#717182] capitalize">
              {status}: <span className="font-semibold text-[#030213]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      <div>
        <h2 className="text-sm font-semibold text-[#717182] uppercase tracking-wider mb-3">
          Pending Invites
          {invites.length > 0 ? (
            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full normal-case">
              {invites.length} pending
            </span>
          ) : null}
        </h2>

        <div className="bg-white rounded-xl border border-[#E4E7EE] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          {invites.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#717182]">No pending invites.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E7EE] bg-[#FAFBFC]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Invited</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-[#E4E7EE] last:border-0 hover:bg-[#F7F9FC] transition-colors">
                    <td className="px-4 py-3 text-[#030213]">{invite.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {invite.role ?? 'unknown'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#717182]">
                      {new Date(invite.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          'use server'
                          await revokeInvite(invite.id)
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-[#d4183d] hover:text-[#d4183d] hover:bg-red-50 text-xs"
                        >
                          Revoke
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-[#717182] uppercase tracking-wider mb-3">
          Management
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/staff">Manage Staff</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/clinic">Clinic Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
