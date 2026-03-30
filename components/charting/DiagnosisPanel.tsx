'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateDiagnosis } from '@/lib/actions/diagnosis.actions'
import type { AIDiagnosis } from '@/lib/types/diagnosis'

const STAGE_COLORS: Record<string, string> = {
  'Stage I': 'bg-green-100 text-green-800',
  'Stage II': 'bg-yellow-100 text-yellow-800',
  'Stage III': 'bg-orange-100 text-orange-800',
  'Stage IV': 'bg-red-100 text-red-800',
}

const GRADE_COLORS: Record<string, string> = {
  'Grade A': 'bg-blue-100 text-blue-800',
  'Grade B': 'bg-purple-100 text-purple-800',
  'Grade C': 'bg-red-100 text-red-800',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

function DiagnosisCard({ dx }: { dx: AIDiagnosis }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-[#E4E7EE] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {dx.stage ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLORS[dx.stage] ?? 'bg-gray-100 text-gray-700'}`}>
              {dx.stage}
            </span>
          ) : null}
          {dx.grade ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GRADE_COLORS[dx.grade] ?? 'bg-gray-100 text-gray-700'}`}>
              {dx.grade}
            </span>
          ) : null}
          {dx.extent ? (
            <span className="text-xs text-[#717182]">{dx.extent}</span>
          ) : null}
          {dx.findings.treatmentPriority ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[dx.findings.treatmentPriority] ?? ''}`}>
              {dx.findings.treatmentPriority} priority
            </span>
          ) : null}
        </div>
        <span className="text-xs text-[#717182]">
          {new Date(dx.createdAt).toLocaleDateString('en-GB')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-[#F7F9FC] rounded p-2">
          <div className="text-[#717182]">Mean Max PD</div>
          <div className="font-semibold text-[#030213]">{dx.findings.meanMaxPD}mm</div>
        </div>
        <div className="bg-[#F7F9FC] rounded p-2">
          <div className="text-[#717182]">BOP%</div>
          <div className="font-semibold text-[#030213]">{dx.findings.bopPercent}%</div>
        </div>
        <div className="bg-[#F7F9FC] rounded p-2">
          <div className="text-[#717182]">Affected Teeth</div>
          <div className="font-semibold text-[#030213]">{dx.findings.affectedTeethCount}</div>
        </div>
      </div>

      {dx.findings.recommendations.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-[#717182] mb-1">Recommendations</p>
          <ul className="space-y-0.5">
            {dx.findings.recommendations.slice(0, expanded ? undefined : 3).map((r, i) => (
              <li key={i} className="text-xs text-[#030213] flex gap-1.5">
                <span className="text-[#0D9488] mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
          {dx.findings.recommendations.length > 3 ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[#0D9488] mt-1 hover:underline"
            >
              {expanded ? 'Show less' : `+${dx.findings.recommendations.length - 3} more`}
            </button>
          ) : null}
        </div>
      ) : null}

      {dx.findings.riskFactors.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {dx.findings.riskFactors.map((f, i) => (
            <span key={i} className="text-[10px] bg-[#E9EBEF] text-[#717182] px-1.5 py-0.5 rounded">
              {f}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function DiagnosisPanel({
  chartId,
  patientId,
  initialDiagnoses,
  readOnly = false,
}: {
  chartId: string
  patientId: string
  initialDiagnoses: AIDiagnosis[]
  readOnly?: boolean
}) {
  const [diagnoses, setDiagnoses] = useState(initialDiagnoses)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateDiagnosis(chartId, patientId)
      if (result?.error) {
        setError(result.error)
      } else if (result?.diagnosis) {
        // Optimistically prepend the new diagnosis
        const newDx: AIDiagnosis = {
          id: result.id ?? crypto.randomUUID(),
          chartId,
          patientId,
          generatedBy: null,
          stage: result.diagnosis.stage,
          grade: result.diagnosis.grade,
          extent: result.diagnosis.extent,
          findings: result.diagnosis.findings,
          rawResponse: result.diagnosis.rawResponse,
          modelUsed: result.diagnosis.modelUsed,
          createdAt: new Date().toISOString(),
        }
        setDiagnoses(prev => [newDx, ...prev])
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#030213]">AI Diagnosis</h3>
        {!readOnly ? (
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-[#0D9488] hover:bg-[#0B7C71] text-white text-xs"
          >
            {isPending ? 'Generating…' : '✦ Generate Diagnosis'}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-[#d4183d] bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
          {error}
        </p>
      ) : null}

      {isPending ? (
        <div className="border border-[#E4E7EE] rounded-lg p-6 text-center">
          <div className="text-sm text-[#717182]">Analyzing chart data…</div>
          <div className="text-xs text-[#717182] mt-1">This may take a few seconds</div>
        </div>
      ) : diagnoses.length === 0 ? (
        <p className="text-sm text-[#717182] italic">No diagnoses generated yet.</p>
      ) : (
        <div className="space-y-3">
          {diagnoses.map((dx) => (
            <DiagnosisCard key={dx.id} dx={dx} />
          ))}
        </div>
      )}
    </div>
  )
}
