'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import type { ChartReport } from '@/lib/types/report'

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ReportPanel({
  chartId,
  initialReports,
}: {
  chartId: string
  initialReports: ChartReport[]
}) {
  const [reports, setReports] = useState(initialReports)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/reports/generate/${chartId}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to generate report')
        return
      }
      // Reload the page to get the new report in the list
      window.location.reload()
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#030213]">Reports</h3>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isPending}
          variant="outline"
          className="text-xs"
        >
          {isPending ? 'Generating…' : '↓ Generate PDF'}
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-[#d4183d] bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
          {error}
        </p>
      ) : null}

      {reports.length === 0 ? (
        <p className="text-sm text-[#717182] italic">No reports generated yet.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-1.5 border-b border-[#E4E7EE] last:border-0">
              <div>
                <p className="text-xs font-medium text-[#030213] truncate max-w-[200px]">{r.fileName}</p>
                <p className="text-[10px] text-[#717182]">
                  {new Date(r.createdAt).toLocaleDateString('en-GB')}
                  {r.fileSizeBytes ? ` · ${formatBytes(r.fileSizeBytes)}` : ''}
                </p>
              </div>
              <a
                href={`/api/reports/download?path=${encodeURIComponent(r.storagePath)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0D9488] hover:underline"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
