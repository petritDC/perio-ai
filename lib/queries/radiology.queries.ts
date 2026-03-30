import { createClient } from '@/lib/supabase/server'

export interface RadiologyImage {
  id: string
  patientId: string
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  uploadedBy: string | null
  createdAt: string
}

export interface PatientSearchResult {
  id: string
  fullName: string | null
  email: string
}

export async function searchPatients(query: string): Promise<PatientSearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'patient')
    .ilike('full_name', `%${query.trim()}%`)
    .limit(10)

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: '',
  }))
}

export async function getPatientRadiologyImages(patientId: string): Promise<RadiologyImage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patient_documents')
    .select('id, patient_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at')
    .eq('patient_id', patientId)
    .eq('category', 'radiology')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }))
}
