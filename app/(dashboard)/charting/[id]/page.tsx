import { notFound, redirect } from 'next/navigation'
import { getChart } from '@/lib/queries/charting.queries'
import { getSession } from '@/lib/auth/session'
import ChartingPage from '@/components/charting/ChartingPage'
import { ChartBackButton } from '@/components/charting/ChartBackButton'

export default async function ChartWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ patientId?: string }>
}) {
  const { id } = await params
  const { patientId: patientIdFromQuery } = await searchParams
  const [chart, session] = await Promise.all([getChart(id), getSession()])

  if (!chart) notFound()

  if (patientIdFromQuery !== chart.patientId) {
    redirect(`/charting/${id}?patientId=${encodeURIComponent(chart.patientId)}`)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ChartBackButton />
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213]">
          Periodontal Chart
        </h1>
      </div>
      <ChartingPage chart={chart} role={session?.role ?? 'patient'} />
    </div>
  )
}
