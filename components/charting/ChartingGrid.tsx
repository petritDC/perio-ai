import type { ToothData } from '@/lib/types/charting'

function maxPD(tooth: ToothData): number {
  const vals = [tooth.pdDb, tooth.pdB, tooth.pdMb, tooth.pdDl, tooth.pdL, tooth.pdMl]
  return Math.max(...vals.filter((v): v is number => v !== null), 0)
}

function bopCount(tooth: ToothData): number {
  return [tooth.bopDb, tooth.bopB, tooth.bopMb, tooth.bopDl, tooth.bopL, tooth.bopMl]
    .filter(Boolean).length
}

export default function ChartingGrid({ teeth }: { teeth: ToothData[] }) {
  if (teeth.length === 0) {
    return <p className="text-sm text-[#717182] italic">No teeth recorded yet.</p>
  }

  const sorted = [...teeth].sort((a, b) => a.toothNumber - b.toothNumber)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#E4E7EE]">
            <th className="text-left px-3 py-2 text-[#717182] font-semibold">Tooth</th>
            <th className="text-center px-3 py-2 text-[#717182] font-semibold">Max PD</th>
            <th className="text-center px-3 py-2 text-[#717182] font-semibold">BOP</th>
            <th className="text-center px-3 py-2 text-[#717182] font-semibold">Furc</th>
            <th className="text-center px-3 py-2 text-[#717182] font-semibold">Mob</th>
            <th className="text-center px-3 py-2 text-[#717182] font-semibold">Flags</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tooth) => {
            const pd = maxPD(tooth)
            const bop = bopCount(tooth)
            const pdColor = pd >= 6 ? 'text-red-600' : pd >= 4 ? 'text-amber-600' : 'text-[#030213]'
            return (
              <tr key={tooth.toothNumber} className="border-b border-[#E4E7EE] last:border-0 hover:bg-[#F7F9FC]">
                <td className="px-3 py-2 font-medium text-[#030213]">{tooth.toothNumber}</td>
                <td className={`px-3 py-2 text-center font-medium ${pdColor}`}>
                  {pd > 0 ? `${pd}mm` : '—'}
                </td>
                <td className="px-3 py-2 text-center">
                  {bop > 0 ? <span className="text-red-500">{bop}/6</span> : '—'}
                </td>
                <td className="px-3 py-2 text-center">{tooth.furcation > 0 ? tooth.furcation : '—'}</td>
                <td className="px-3 py-2 text-center">{tooth.mobility > 0 ? tooth.mobility : '—'}</td>
                <td className="px-3 py-2 text-center text-[#717182]">
                  {tooth.missing ? 'Missing ' : ''}
                  {tooth.implant ? 'Impl.' : ''}
                  {!tooth.missing && !tooth.implant ? '—' : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
