import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { UserPlus, MoreVertical } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { getStaffMembersPaginated, STAFF_LIST_PAGE_SIZE } from '@/lib/queries/staff.queries'
import { StaffSearchInput } from '@/components/staff/StaffSearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const roleLabels = {
  admin: 'Administrator',
  dentist: 'Periodontist',
  hygienist: 'Dental Hygienist',
  receptionist: 'Receptionist',
} as const

const statusStyles = {
  active: 'bg-[#ECFDF3] text-[#027A48]',
  inactive: 'bg-[#F2F4F7] text-[#475467]',
  pending: 'bg-[#FFFAEB] text-[#B54708]',
} as const

function getInitials(name: string | null) {
  if (!name) return 'TM'

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

function staffListHref(page: number, search?: string) {
  const params = new URLSearchParams()
  if (search?.trim()) params.set('search', search.trim())
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/staff?${qs}` : '/staff'
}

export default async function StaffPage({ searchParams }: PageProps) {
  await requireRole(['admin'])
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  const { data: staff, count } = await getStaffMembersPaginated({
    search: params.search,
    page,
  })
  const totalPages = Math.max(1, Math.ceil(count / STAFF_LIST_PAGE_SIZE))
  if (page > totalPages && count > 0) {
    redirect(staffListHref(totalPages, params.search))
  }

  const hasSearch = Boolean(params.search?.trim())
  const emptyMessage = hasSearch
    ? 'No team members match your search.'
    : 'No team members have been added yet.'

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1
            className="text-[38px] font-semibold leading-none tracking-[-0.03em] text-[#1F2A44]"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Staff &amp; Roles
          </h1>
          <p className="text-[22px] text-[#44526C]">
            Manage team members and permissions
          </p>
        </div>

        <Button
          asChild
          className="h-11 rounded-full bg-[#3BA39B] px-5 text-[15px] font-semibold text-white hover:bg-[#2F8D86]"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          <Link href="/staff/invite">
            <UserPlus className="size-4" />
            Invite Team Member
          </Link>
        </Button>
      </div>

      <section className="rounded-[22px] border border-[#D7E0EC] bg-white px-6 py-6 shadow-[var(--shadow-card)] md:px-7">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2
            className="text-[22px] font-semibold tracking-[-0.02em] text-[#1F2A44]"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Team Members
          </h2>

          <Suspense fallback={<div className="h-11 w-full max-w-[320px] rounded-2xl bg-[#F8FAFC]" />}>
            <StaffSearchInput />
          </Suspense>
        </div>

        <div className="overflow-x-auto rounded-[18px] border border-[#E5EAF1]">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-[#F8FAFC]">
              <tr className="border-b border-[#D7E0EC]">
                <th className="px-6 py-4 text-left text-[15px] font-semibold text-[#111827]">Team Member</th>
                <th className="px-6 py-4 text-left text-[15px] font-semibold text-[#111827]">Email</th>
                <th className="px-6 py-4 text-left text-[15px] font-semibold text-[#111827]">Role</th>
                <th className="px-6 py-4 text-left text-[15px] font-semibold text-[#111827]">Status</th>
                <th className="px-6 py-4 text-left text-[15px] font-semibold text-[#111827]">Last Active</th>
                <th className="w-14 px-4 py-4" />
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-[15px] text-[#667085]">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-[#E5EAF1] bg-white transition-colors last:border-b-0 hover:bg-[#FBFDFF]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4A90E2] to-[#39B8B2] text-[14px] font-semibold text-white">
                          {getInitials(member.fullName)}
                        </div>
                        <span
                          className="text-[16px] font-medium text-[#1F2A44]"
                          style={{ fontFamily: 'var(--font-sora)' }}
                        >
                          {member.fullName ?? 'Unnamed team member'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[15px] text-[#44526C]">
                      {member.email || 'Email unavailable'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="h-7 rounded-full border-0 bg-[#E8F7F4] px-3 text-[14px] font-medium text-[#147D73]">
                        {roleLabels[member.role] ?? member.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`h-7 rounded-full border-0 px-3 text-[14px] font-medium ${statusStyles[member.status]}`}
                      >
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[15px] text-[#44526C]">
                      {member.status === 'active' ? 'Recently active' : 'Awaiting activity'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                        className="rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#334155]"
                      >
                        <Link href={`/staff/${member.id}`} aria-label={`Edit ${member.fullName ?? 'staff member'}`}>
                          <MoreVertical className="size-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-3 border-t border-[#E5EAF1] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-[#667085]">
              Page {page} of {totalPages}
              {count > 0 && (
                <span className="text-[#94A3B8]"> · {count} team member{count === 1 ? '' : 's'}</span>
              )}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild className="h-9 rounded-full border-[#D7E0EC] text-[14px]">
                  <Link href={staffListHref(page - 1, params.search)}>Previous</Link>
                </Button>
              )}
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild className="h-9 rounded-full border-[#D7E0EC] text-[14px]">
                  <Link href={staffListHref(page + 1, params.search)}>Next</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
