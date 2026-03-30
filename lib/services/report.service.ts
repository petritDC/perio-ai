import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { ReportDocument } from '@/lib/pdf/report-document'
import type { ChartWithTeeth } from '@/lib/types/charting'
import type { AIDiagnosis } from '@/lib/types/diagnosis'

export interface ReportUploadResult {
  storagePath: string
  fileName: string
  fileSizeBytes: number
}

export async function generateReportPDF(
  chart: ChartWithTeeth,
  patientName: string,
  providerName: string,
  diagnosis: AIDiagnosis | null
): Promise<Buffer> {
  const element = React.createElement(ReportDocument, {
    chart,
    patientName,
    providerName,
    diagnosis,
  })
  return renderToBuffer(element)
}

export async function uploadReportToStorage(
  supabase: any,
  buffer: Buffer,
  chartId: string,
  patientId: string
): Promise<ReportUploadResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `chart-report-${chartId.slice(0, 8)}-${timestamp}.pdf`
  const storagePath = `${patientId}/${chartId}/${fileName}`

  const { error } = await supabase.storage
    .from('reports')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  return {
    storagePath,
    fileName,
    fileSizeBytes: buffer.length,
  }
}
