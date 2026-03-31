import { notFound } from 'next/navigation'
import { getStaffMember, getStaffAvailability } from '@/lib/queries/staff.queries'
import StaffEditForm from '@/components/settings/StaffEditForm'
import AvailabilityEditor from '@/components/settings/AvailabilityEditor'

export default async function StaffMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [member, availability] = await Promise.all([
    getStaffMember(id),
    getStaffAvailability(id),
  ])

  if (!member) notFound()

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213]">
        {member.fullName ?? member.email}
      </h1>

      <StaffEditForm member={member} />
      <AvailabilityEditor userId={id} availability={availability} />
    </div>
  )
}
