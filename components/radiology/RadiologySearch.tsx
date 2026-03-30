'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

interface SearchResult {
  id: string
  fullName: string | null
  email: string
}

export default function RadiologySearch({ currentPatientId }: { currentPatientId?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/radiology/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  function selectPatient(id: string) {
    setOpen(false)
    setQuery('')
    router.push(`/radiology?patientId=${id}`)
  }

  return (
    <div className="relative max-w-sm">
      <Input
        placeholder="Search patient by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="pr-8"
      />
      {loading ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717182] text-xs">…</span>
      ) : null}

      {open ? (
        <ul className="absolute z-10 top-full mt-1 w-full bg-white border border-[#E4E7EE] rounded-lg shadow-lg overflow-hidden">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onMouseDown={() => selectPatient(r.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F7F9FC] transition-colors ${
                  r.id === currentPatientId ? 'bg-teal-50 text-[#0D9488]' : 'text-[#030213]'
                }`}
              >
                {r.fullName ?? r.email}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
