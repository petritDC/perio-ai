import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])

    const path = req.nextUrl.searchParams.get('path')
    if (!path) {
      return NextResponse.json({ error: 'path required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from('reports')
      .createSignedUrl(path, 300) // 5-minute expiry

    if (error || !data) {
      return NextResponse.json({ error: 'Could not generate download URL' }, { status: 500 })
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
