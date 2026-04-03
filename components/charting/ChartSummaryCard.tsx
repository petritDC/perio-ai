import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ChartListItem } from '@/lib/types/charting'

export default function ChartSummaryCard({
  patientId,
  charts,
  canCreateChart = true,
}: {
  patientId: string
  charts: ChartListItem[]
  canCreateChart?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#030213]">Periodontal Charts</h3>
        {canCreateChart ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/charting/new?patientId=${patientId}`}>New Chart</Link>
          </Button>
        ) : null}
      </div>

      {charts.length === 0 ? (
        <p className="text-sm text-[#717182]">No charts yet.</p>
      ) : (
        <ul className="space-y-1">
          {charts.slice(0, 5).map((c) => (
            <li key={c.id}>
              <Link
                href={`/charting/${c.id}?patientId=${encodeURIComponent(patientId)}`}
                className="flex items-center justify-between py-1.5 hover:bg-[#F7F9FC] rounded px-1 transition-colors"
              >
                <span className="text-sm text-[#030213]">{c.chartDate}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#717182]">{c.toothCount} teeth</span>
                  <Badge variant={c.status === 'finalized' ? 'default' : 'secondary'}>
                    {c.status}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
