import { NextRequest, NextResponse } from 'next/server'
import { searchPatients } from '@/lib/queries/radiology.queries'
import { requireRole } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
    const q = req.nextUrl.searchParams.get('q') ?? ''
    const results = await searchPatients(q)
    return NextResponse.json(results)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
