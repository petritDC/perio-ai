'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

type Tab = { id: string; label: string }

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'charting', label: 'Charting' },
  { id: 'radiology', label: 'Radiology' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'treatment', label: 'Treatment Plan' },
]

function TabsInner({
  tabContent,
}: {
  tabContent: Record<string, React.ReactNode>
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const active = searchParams.get('tab') ?? 'overview'

  const handleTab = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-[#E4E7EE] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTab(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
              active === tab.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabContent[active] ?? null}
    </div>
  )
}

export function PatientProfileTabs({
  tabContent,
}: {
  tabContent: Record<string, React.ReactNode>
}) {
  return (
    <Suspense fallback={<div className="h-10 bg-slate-100 rounded animate-pulse" />}>
      <TabsInner tabContent={tabContent} />
    </Suspense>
  )
}
