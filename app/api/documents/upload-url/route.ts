import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
    const { fileName, contentType, patientId } = await req.json()
    const supabase = await createClient()

    const path = `patients/${patientId}/${Date.now()}-${fileName}`
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(path)

    if (error) {
      console.error('[upload-url] storage error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ signedUrl: data.signedUrl, path })
  } catch (err) {
    console.error('[upload-url] caught error:', err)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
