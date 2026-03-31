import { notFound } from 'next/navigation'
import { getChart } from '@/lib/queries/charting.queries'
import { getSession } from '@/lib/auth/session'
import ChartingPage from '@/components/charting/ChartingPage'

export default async function ChartWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [chart, session] = await Promise.all([getChart(id), getSession()])

  if (!chart) notFound()

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-4">
        Periodontal Chart
      </h1>
      <ChartingPage chart={chart} role={session?.role ?? 'patient'} />
    </div>
  )
}
