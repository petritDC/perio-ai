import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { getStaffMembers } from '@/lib/queries/staff.queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function StaffPage() {
  await requireRole(['admin'])
  const staff = await getStaffMembers()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213]">
          Staff
        </h1>
        <Button asChild size="sm">
          <Link href="/settings/staff/invite">Invite Staff</Link>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EE] bg-[#FAFBFC]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#717182]">
                  No staff members yet.
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.id} className="border-b border-[#E4E7EE] last:border-0 hover:bg-[#F7F9FC] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#030213]">
                    {member.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 capitalize text-[#717182]">{member.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/settings/staff/${member.id}`}>Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
