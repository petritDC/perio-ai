import { getRecentReports } from '@/lib/queries/report.queries'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function ReportsPage() {
  const reports = await getRecentReports(50)

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        Reports
      </h1>

      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EE] bg-[#FAFBFC]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">File</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Generated</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717182] uppercase tracking-wider">Size</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#717182]">
                  No reports generated yet.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-b border-[#E4E7EE] last:border-0 hover:bg-[#F7F9FC] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#030213] max-w-xs truncate">{r.fileName}</td>
                  <td className="px-4 py-3 text-[#717182]">
                    {new Date(r.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 text-[#717182]">{formatBytes(r.fileSizeBytes)}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/reports/download?path=${encodeURIComponent(r.storagePath)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0D9488] hover:underline"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
