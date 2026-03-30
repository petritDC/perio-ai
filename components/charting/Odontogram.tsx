'use client'

import type { ToothData } from '@/lib/types/charting'
import { FDI_TEETH } from '@/lib/types/charting'

function maxPD(tooth: ToothData | undefined): number {
  if (!tooth) return 0
  const vals = [tooth.pdDb, tooth.pdB, tooth.pdMb, tooth.pdDl, tooth.pdL, tooth.pdMl]
  return Math.max(...vals.filter((v): v is number => v !== null))
}

function toothColor(tooth: ToothData | undefined): string {
  if (!tooth) return '#E4E7EE'
  if (tooth.missing) return '#F3F4F6'
  if (tooth.implant) return '#BFDBFE'
  const pd = maxPD(tooth)
  if (pd >= 6) return '#FCA5A5'   // red — severe
  if (pd >= 4) return '#FCD34D'   // yellow — moderate
  if (pd > 0)  return '#6EE7B7'   // green — mild
  return '#E4E7EE'                 // no data
}

function ToothBox({
  number,
  tooth,
  selected,
  onClick,
}: {
  number: number
  tooth: ToothData | undefined
  selected: boolean
  onClick: () => void
}) {
  const color = toothColor(tooth)
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Tooth ${number}${tooth ? ` — max PD ${maxPD(tooth)}mm` : ''}`}
      className={`w-8 h-10 rounded border-2 text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
        selected
          ? 'border-[#0D9488] ring-2 ring-[#0D9488]/30'
          : 'border-[#E4E7EE] hover:border-[#0D9488]/40'
      }`}
      style={{ backgroundColor: color }}
    >
      <span>{number}</span>
      {tooth?.missing ? <span className="text-[7px] text-gray-400">X</span> : null}
    </button>
  )
}

export default function Odontogram({
  teeth,
  selectedTooth,
  onSelectTooth,
  readOnly = false,
}: {
  teeth: ToothData[]
  selectedTooth: number | null
  onSelectTooth: (n: number) => void
  readOnly?: boolean
}) {
  const toothMap = new Map(teeth.map((t) => [t.toothNumber, t]))

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
      <div className="text-xs text-[#717182] mb-2 font-medium">
        Odontogram — click a tooth to enter measurements
      </div>

      {/* Upper arch */}
      <div className="flex gap-1 justify-center mb-1">
        {FDI_TEETH.upperRight.map((n) => (
          <ToothBox
            key={n}
            number={n}
            tooth={toothMap.get(n)}
            selected={selectedTooth === n}
            onClick={() => !readOnly && onSelectTooth(n)}
          />
        ))}
        <div className="w-2" />
        {FDI_TEETH.upperLeft.map((n) => (
          <ToothBox
            key={n}
            number={n}
            tooth={toothMap.get(n)}
            selected={selectedTooth === n}
            onClick={() => !readOnly && onSelectTooth(n)}
          />
        ))}
      </div>

      <div className="border-t border-dashed border-[#E4E7EE] my-2" />

      {/* Lower arch */}
      <div className="flex gap-1 justify-center mt-1">
        {FDI_TEETH.lowerRight.slice().reverse().map((n) => (
          <ToothBox
            key={n}
            number={n}
            tooth={toothMap.get(n)}
            selected={selectedTooth === n}
            onClick={() => !readOnly && onSelectTooth(n)}
          />
        ))}
        <div className="w-2" />
        {FDI_TEETH.lowerLeft.map((n) => (
          <ToothBox
            key={n}
            number={n}
            tooth={toothMap.get(n)}
            selected={selectedTooth === n}
            onClick={() => !readOnly && onSelectTooth(n)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-[#717182]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background:'#E4E7EE'}} /> No data</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background:'#6EE7B7'}} /> PD 1-3mm</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background:'#FCD34D'}} /> PD 4-5mm</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background:'#FCA5A5'}} /> PD ≥6mm</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background:'#BFDBFE'}} /> Implant</span>
      </div>
    </div>
  )
}
