import { getRecentDiagnoses } from '@/lib/queries/diagnosis.queries'

const STAGE_COLORS: Record<string, string> = {
  'Stage I': 'bg-green-100 text-green-800',
  'Stage II': 'bg-yellow-100 text-yellow-800',
  'Stage III': 'bg-orange-100 text-orange-800',
  'Stage IV': 'bg-red-100 text-red-800',
}

export default async function DiagnosticsPage() {
  const diagnoses = await getRecentDiagnoses(50)

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        AI Diagnostics
      </h1>

      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EE] bg-[#FAFBFC]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Grade</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Extent</th>
            </tr>
          </thead>
          <tbody>
            {diagnoses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#717182]">
                  No diagnoses generated yet.
                </td>
              </tr>
            ) : (
              diagnoses.map((dx) => (
                <tr key={dx.id} className="border-b border-[#E4E7EE] last:border-0 hover:bg-[#F7F9FC] transition-colors">
                  <td className="px-4 py-3 text-[#717182]">
                    {new Date(dx.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3">
                    {dx.stage ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLORS[dx.stage] ?? 'bg-gray-100 text-gray-700'}`}>
                        {dx.stage}
                      </span>
                    ) : <span className="text-[#717182]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#030213]">{dx.grade ?? '—'}</td>
                  <td className="px-4 py-3 text-[#717182]">{dx.extent ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
