'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Odontogram from './Odontogram'
import ToothPanel from './ToothPanel'
import ChartingGrid from './ChartingGrid'
import { finalizeChart } from '@/lib/actions/charting.actions'
import type { ChartWithTeeth } from '@/lib/types/charting'

export default function ChartingPage({ chart }: { chart: ChartWithTeeth }) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const readOnly = chart.status === 'finalized'
  const selectedData = selectedTooth
    ? chart.teeth.find((t) => t.toothNumber === selectedTooth)
    : undefined

  function handleFinalize() {
    setError(null)
    startTransition(async () => {
      const result = await finalizeChart(chart.id)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Chart header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#717182]">Date: {chart.chartDate}</span>
          <Badge variant={chart.status === 'finalized' ? 'default' : 'secondary'}>
            {chart.status}
          </Badge>
        </div>
        {!readOnly ? (
          <div className="flex items-center gap-3">
            {error ? <span className="text-xs text-[#d4183d]">{error}</span> : null}
            <Button
              size="sm"
              variant="outline"
              onClick={handleFinalize}
              disabled={isPending}
            >
              {isPending ? 'Finalizing…' : 'Finalize Chart'}
            </Button>
          </div>
        ) : (
          <span className="text-xs text-[#717182]">Read-only — chart is finalized</span>
        )}
      </div>

      {/* Odontogram */}
      <Odontogram
        teeth={chart.teeth}
        selectedTooth={selectedTooth}
        onSelectTooth={setSelectedTooth}
        readOnly={readOnly}
      />

      {/* Two-column layout: tooth panel + grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          {selectedTooth ? (
            <ToothPanel
              key={selectedTooth}
              chartId={chart.id}
              toothNumber={selectedTooth}
              existing={selectedData}
              readOnly={readOnly}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 text-center text-sm text-[#717182]">
              Select a tooth in the odontogram to enter measurements.
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
          <h3 className="text-sm font-semibold text-[#030213] mb-3">Recorded Teeth</h3>
          <ChartingGrid teeth={chart.teeth} />
        </div>
      </div>
    </div>
  )
}
