import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    blData: {
      source: 'mock',
      measurements: [
        { tooth: 11, boneLevel_mm: 3.2, boneLevel_pct: 22 },
        { tooth: 21, boneLevel_mm: 2.8, boneLevel_pct: 18 },
        { tooth: 36, boneLevel_mm: 5.1, boneLevel_pct: 34 },
        { tooth: 46, boneLevel_mm: 4.4, boneLevel_pct: 29 },
        { tooth: 16, boneLevel_mm: 1.8, boneLevel_pct: 12 },
        { tooth: 26, boneLevel_mm: 2.1, boneLevel_pct: 14 },
      ],
    },
  })
}
