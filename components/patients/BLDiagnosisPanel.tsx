import type { ReactNode } from 'react'
import type { BLDiagnosis, BLTooth } from '@/lib/services/bl-diagnosis.service'

function Badge({
  children,
  colorClass,
}: {
  children: ReactNode
  colorClass: string
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass}`}
    >
      {children}
    </span>
  )
}

export function BLDiagnosisPanel({
  diagnosis,
  teeth,
}: {
  diagnosis: BLDiagnosis
  teeth: BLTooth[]
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 mb-4"
      style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[13px] font-semibold text-slate-900"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Nanok AI Diagnosis
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">mock_BL.JSON</span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge colorClass="bg-blue-50 text-blue-700 border-blue-200">{diagnosis.stage}</Badge>
        <Badge colorClass="bg-purple-50 text-purple-700 border-purple-200">{diagnosis.grade}</Badge>
        <Badge colorClass="bg-teal-50 text-teal-700 border-teal-200">{diagnosis.extent}</Badge>
      </div>

      {/* Full diagnosis string */}
      <p
        className="text-[13px] font-medium text-slate-800 mb-2"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        {diagnosis.fullDiagnosis}
      </p>

      {/* Max bone loss */}
      <p className="text-[12px] text-slate-500 mb-3">
        Max bone loss:{' '}
        <span className="font-semibold text-slate-700">
          {diagnosis.maxBoneLossPct.toFixed(1)}%
        </span>
      </p>

      {/* Grade modifiers */}
      {diagnosis.gradeModifiers.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">
            Grade modifiers
          </p>
          <ul className="space-y-0.5">
            {diagnosis.gradeModifiers.map((mod, i) => (
              <li key={i} className="text-[12px] text-slate-600">
                • {mod}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-tooth L/R measurements */}
      <div className="border-t border-slate-100 pt-3">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-2">
          Per-tooth measurements
        </p>
        <div className="space-y-1">
          {teeth.map((tooth) => (
            <div key={tooth.tooth_id} className="flex justify-between text-[12px]">
              <span className="text-slate-500">Tooth {tooth.tooth_id}</span>
              <span className="text-slate-700 font-medium tabular-nums">
                L {tooth.measurements_mm.left.CEJ_to_BL.toFixed(2)} mm · R{' '}
                {tooth.measurements_mm.right.CEJ_to_BL.toFixed(2)} mm
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
