import { requireRole } from '@/lib/auth/session'
import { getClinicProfile } from '@/lib/queries/staff.queries'
import ClinicSettingsForm from '@/components/settings/ClinicSettingsForm'

export default async function ClinicSettingsPage() {
  await requireRole(['admin'])
  const clinic = await getClinicProfile()

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        Clinic Profile
      </h1>
      <ClinicSettingsForm clinic={clinic} />
    </div>
  )
}
