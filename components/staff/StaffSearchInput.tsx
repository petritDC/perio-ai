'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const DEBOUNCE_MS = 300

export function StaffSearchInput() {
  const searchParams = useSearchParams()
  const committed = searchParams.get('search') ?? ''
  return <StaffSearchInputInner key={committed} committedSearch={committed} />
}

function StaffSearchInputInner({ committedSearch }: { committedSearch: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(committedSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function applySearchToUrl(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = next.trim()
    if (trimmed) {
      params.set('search', trimmed)
    } else {
      params.delete('search')
    }
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `/staff?${qs}` : '/staff')
  }

  return (
    <div className="relative w-full max-w-[320px]">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
      <Input
        value={value}
        onChange={(e) => {
          const next = e.target.value
          setValue(next)
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => applySearchToUrl(next), DEBOUNCE_MS)
        }}
        placeholder="Search staff..."
        aria-label="Search staff"
        className="h-11 rounded-2xl border-[#D7E0EC] bg-[#F8FAFC] pl-11 pr-4 text-[15px] text-[#334155] placeholder:text-[#667085] focus-visible:border-[#CBD5E1] focus-visible:ring-0"
      />
    </div>
  )
}
