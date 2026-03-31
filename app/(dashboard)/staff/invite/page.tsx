import StaffInviteForm from '@/components/settings/StaffInviteForm'

export default function InviteStaffPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        Invite Staff Member
      </h1>
      <StaffInviteForm />
    </div>
  )
}
