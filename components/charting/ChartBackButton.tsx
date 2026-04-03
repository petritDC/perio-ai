'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export function ChartBackButton() {
  const router = useRouter()
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 -ml-2 shrink-0 text-[13px] text-[#717182] hover:text-[#030213]"
      style={{ fontFamily: 'var(--font-sora)' }}
      onClick={() => router.back()}
    >
      <ChevronLeft className="w-4 h-4" />
      Back
    </Button>
  )
}
