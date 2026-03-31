import type { BLTooth } from '@/lib/services/bl-diagnosis.service'

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(value * 100)))
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${pct}% confidence`}>
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-600 tabular-nums w-8">{pct}%</span>
    </div>
  )
}

export function AITeethDataPanel({ teeth }: { teeth: BLTooth[] }) {
  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[13px] font-semibold text-slate-900"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          AI Teeth Data
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">mock_BL.JSON</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4">
                Tooth
              </th>
              <th className="text-left text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4">
                Confidence
              </th>
              <th className="text-right text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4">
                CEJ→BL Left
              </th>
              <th className="text-right text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2">
                CEJ→BL Right
              </th>
            </tr>
          </thead>
          <tbody>
            {teeth.map((tooth) => (
              <tr key={tooth.tooth_id} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-4 text-slate-800 font-semibold">
                  {tooth.tooth_id}
                </td>
                <td className="py-2.5 pr-4">
                  <ConfidenceBar value={tooth.confidence} />
                </td>
                <td className="py-2.5 pr-4 text-right text-slate-700 tabular-nums">
                  {tooth.measurements_mm.left.CEJ_to_BL.toFixed(2)} mm
                </td>
                <td className="py-2.5 text-right text-slate-700 tabular-nums">
                  {tooth.measurements_mm.right.CEJ_to_BL.toFixed(2)} mm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
