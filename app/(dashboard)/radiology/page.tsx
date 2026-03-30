import { requireRole } from '@/lib/auth/session'
import { getPatientRadiologyImages } from '@/lib/queries/radiology.queries'
import RadiologySearch from '@/components/radiology/RadiologySearch'
import RadiologyViewer from '@/components/radiology/RadiologyViewer'

export default async function RadiologyPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  const { patientId } = await searchParams

  const images = patientId ? await getPatientRadiologyImages(patientId) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213]">
          Radiology
        </h1>
      </div>

      {/* Patient search */}
      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
        <p className="text-sm text-[#717182] mb-3">Search for a patient to view or upload radiology images.</p>
        <RadiologySearch currentPatientId={patientId} />
      </div>

      {/* Viewer */}
      {patientId ? (
        <RadiologyViewer patientId={patientId} initialImages={images} />
      ) : (
        <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-10 text-center text-sm text-[#717182]">
          Select a patient to view their radiology images.
        </div>
      )}
    </div>
  )
}
