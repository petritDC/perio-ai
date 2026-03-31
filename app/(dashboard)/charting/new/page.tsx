import { notFound } from 'next/navigation'
import { getStaffMembers } from '@/lib/queries/staff.queries'
import { getSession } from '@/lib/auth/session'
import NewChartForm from '@/components/charting/NewChartForm'

export default async function NewChartPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const { patientId } = await searchParams
  if (!patientId) notFound()

  const [staff, session] = await Promise.all([getStaffMembers(), getSession()])
  const providers = staff.filter((s) => ['dentist', 'hygienist', 'admin'].includes(s.role))
  const defaultProviderId = providers.find((provider) => provider.id === session?.id)?.id
    ?? providers[0]?.id
    ?? ''

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        New Periodontal Chart
      </h1>

      <NewChartForm
        patientId={patientId}
        defaultProviderId={defaultProviderId}
        providers={providers.map((provider) => ({
          id: provider.id,
          label: (provider.fullName ?? provider.email) || 'Unnamed provider',
        }))}
      />
    </div>
  )
}
