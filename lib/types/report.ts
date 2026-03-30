export interface ChartReport {
  id: string
  chartId: string
  patientId: string
  generatedBy: string | null
  storagePath: string
  fileName: string
  fileSizeBytes: number | null
  createdAt: string
}
