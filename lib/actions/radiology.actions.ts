'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession, requireRole } from '@/lib/auth/session'

const addImageSchema = z.object({
  patientId: z.string().uuid('Patient required'),
  fileName: z.string().min(1, 'File name required'),
  filePath: z.string().min(1, 'File path required'),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
})

export async function addRadiologyImage(formData: FormData) {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  const session = await getSession()

  const raw = {
    patientId: formData.get('patientId'),
    fileName: formData.get('fileName'),
    filePath: formData.get('filePath'),
    fileSize: formData.get('fileSize') ? Number(formData.get('fileSize')) : undefined,
    mimeType: formData.get('mimeType') || undefined,
  }

  const parsed = addImageSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('patient_documents').insert({
    patient_id: parsed.data.patientId,
    file_name: parsed.data.fileName,
    file_path: parsed.data.filePath,
    category: 'radiology',
    file_size: parsed.data.fileSize ?? null,
    mime_type: parsed.data.mimeType ?? null,
    uploaded_by: session?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/radiology')
  return { success: true }
}

export async function deleteRadiologyImage(id: string, filePath: string) {
  await requireRole(['admin', 'dentist'])

  const supabase = await createClient()

  // Remove from storage
  await supabase.storage.from('documents').remove([filePath])

  // Remove metadata record
  const { error } = await supabase
    .from('patient_documents')
    .delete()
    .eq('id', id)
    .eq('category', 'radiology')

  if (error) return { error: error.message }

  revalidatePath('/radiology')
  return { success: true }
}
