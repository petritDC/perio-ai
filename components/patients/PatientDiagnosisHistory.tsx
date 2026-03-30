import type { AIDiagnosis } from '@/lib/types/diagnosis'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StageBadge({ stage }: { stage: string | null }) {
  if (!stage) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400" style={{ fontFamily: 'var(--font-sora)' }}>
        —
      </span>
    )
  }
  const isHighStage = stage === 'Stage III' || stage === 'Stage IV'
  const cls = isHighStage
    ? 'bg-teal-50 text-teal-700 border border-teal-200'
    : 'bg-slate-100 text-slate-600 border border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`} style={{ fontFamily: 'var(--font-sora)' }}>
      {stage}
    </span>
  )
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400" style={{ fontFamily: 'var(--font-sora)' }}>
        —
      </span>
    )
  }
  let cls = 'bg-slate-100 text-slate-600 border border-slate-200'
  if (grade === 'Grade A') cls = 'bg-green-50 text-green-700 border border-green-200'
  if (grade === 'Grade C') cls = 'bg-amber-50 text-amber-700 border border-amber-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`} style={{ fontFamily: 'var(--font-sora)' }}>
      {grade}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' | 'urgent' }) {
  const map: Record<string, string> = {
    low: 'bg-green-50 text-green-700 border border-green-200',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    urgent: 'bg-red-50 text-red-700 border border-red-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[priority]}`} style={{ fontFamily: 'var(--font-sora)' }}>
      {priority}
    </span>
  )
}

export function PatientDiagnosisHistory({ diagnoses }: { diagnoses: AIDiagnosis[] }) {
  if (diagnoses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center text-center" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid #E4E7EE' }}>
        <p className="text-[14px] text-[#717182] italic">No AI diagnoses recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {diagnoses.map((dx) => (
        <div key={dx.id} className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid #E4E7EE' }}>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StageBadge stage={dx.stage} />
              <GradeBadge grade={dx.grade} />
              {dx.extent && (
                <span className="text-[12px] text-[#717182] italic">{dx.extent}</span>
              )}
            </div>
            <span className="text-[12px] text-[#717182]" style={{ fontFamily: 'var(--font-sora)' }}>
              {formatDate(dx.createdAt)}
            </span>
          </div>

          {/* Findings summary */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 pb-4 border-b border-[#E4E7EE]">
            <div>
              <span className="text-[11px] font-medium text-[#717182] uppercase tracking-wider" style={{ fontFamily: 'var(--font-sora)' }}>BOP</span>
              <span className="ml-1.5 text-[13px] font-semibold text-[#030213]">{dx.findings.bopPercent}%</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#717182] uppercase tracking-wider" style={{ fontFamily: 'var(--font-sora)' }}>Mean Max PD</span>
              <span className="ml-1.5 text-[13px] font-semibold text-[#030213]">{dx.findings.meanMaxPD} mm</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#717182] uppercase tracking-wider" style={{ fontFamily: 'var(--font-sora)' }}>Affected Teeth</span>
              <span className="ml-1.5 text-[13px] font-semibold text-[#030213]">{dx.findings.affectedTeethCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#717182] uppercase tracking-wider" style={{ fontFamily: 'var(--font-sora)' }}>Priority</span>
              <PriorityBadge priority={dx.findings.treatmentPriority} />
            </div>
          </div>

          {/* Risk factors */}
          {dx.findings.riskFactors.length > 0 && (
            <div className="mb-3">
              <span className="text-[11px] font-semibold text-[#717182] uppercase tracking-wider" style={{ fontFamily: 'var(--font-sora)' }}>Risk Factors: </span>
              <span className="text-[12px] text-[#030213]">{dx.findings.riskFactors.join(', ')}</span>
            </div>
          )}

          {/* Recommendations */}
          {dx.findings.recommendations.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#717182] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-sora)' }}>Recommendations</p>
              <ul className="list-disc list-inside space-y-1">
                {dx.findings.recommendations.map((rec, i) => (
                  <li key={i} className="text-[13px] text-[#030213]">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
