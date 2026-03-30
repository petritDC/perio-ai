import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
    const path = req.nextUrl.searchParams.get('path')
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(path, 60) // 60 second expiry

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.redirect(data.signedUrl)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
