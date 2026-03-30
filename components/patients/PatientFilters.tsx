'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const SORT_OPTIONS = [
  { label: 'Newest', value: 'created_at:desc' },
  { label: 'Oldest', value: 'created_at:asc' },
  { label: 'Name A–Z', value: 'full_name:asc' },
  { label: 'Name Z–A', value: 'full_name:desc' },
]

export function PatientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/patients?${params.toString()}`)
  }, [router, searchParams])

  const activeStatus = searchParams.get('status') ?? 'all'
  const activeSort = searchParams.get('sort') ?? 'created_at:desc'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search patients…"
        value={searchParams.get('search') ?? ''}
        onChange={(e) => updateParam('search', e.target.value)}
        className="w-56 h-9 text-[13px] border-[#E4E7EE]"
      />

      {/* Status filter */}
      <div className="flex gap-1">
        {['all', 'active', 'inactive', 'archived'].map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            onClick={() => updateParam('status', s)}
            className={`h-8 px-3 text-[12px] capitalize rounded-lg ${
              activeStatus === s
                ? 'bg-teal-50 text-teal-700 font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-[11px] text-slate-400 font-medium" style={{ fontFamily: 'var(--font-sora)' }}>Sort:</span>
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              onClick={() => updateParam('sort', opt.value)}
              className={`h-8 px-2.5 text-[11px] rounded-lg ${
                activeSort === opt.value
                  ? 'bg-slate-100 text-slate-800 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
