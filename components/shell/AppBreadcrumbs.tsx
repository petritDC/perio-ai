'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const STATIC_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  clinic: 'Clinic',
  billing: 'Billing',
  settings: 'Settings',
  staff: 'Staff',
  schedule: 'Appointments',
  charting: 'Charting',
  radiology: 'Radiology',
  diagnostics: 'Diagnostics',
  reports: 'Reports',
  admin: 'Admin',
}

function looksLikeDynamicId(segment: string): boolean {
  if (segment === 'new' || segment === 'edit') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) || segment.length >= 24
}

function labelForSegment(segments: string[], index: number): string {
  const seg = segments[index]
  const prev = index > 0 ? segments[index - 1] : ''

  const staticLabel = STATIC_LABELS[seg]
  if (staticLabel) return staticLabel

  if (seg === 'new') {
    if (prev === 'patients') return 'New patient'
    if (prev === 'charting') return 'New chart'
    if (prev === 'schedule') return 'New appointment'
    return 'New'
  }

  if (seg === 'edit') return 'Edit'

  if (looksLikeDynamicId(seg)) {
    if (prev === 'patients') return 'Patient'
    if (prev === 'charting') return 'Chart'
    if (prev === 'staff') return 'Team member'
    if (prev === 'schedule') return 'Appointment'
    return 'Details'
  }

  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export type BreadcrumbItem = {
  href: string
  label: string
  current: boolean
}

export type BreadcrumbOptions = {
  /** When set on `/charting/...` routes, the "Charting" crumb links to this patient's charting tab */
  chartPatientId?: string | null
}

export function getBreadcrumbItems(
  pathname: string,
  options?: BreadcrumbOptions,
): BreadcrumbItem[] {
  const chartPatientId = options?.chartPatientId?.trim() || null
  const clean = pathname.replace(/\/$/, '') || '/'
  if (clean === '/dashboard') {
    return []
  }

  const segments = clean.split('/').filter(Boolean)
  if (segments.length === 0) {
    return [{ href: '/dashboard', label: 'Dashboard', current: true }]
  }

  const items: BreadcrumbItem[] = [
    { href: '/dashboard', label: 'Dashboard', current: false },
  ]

  let acc = ''
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`
    const label = labelForSegment(segments, i)
    const isLast = i === segments.length - 1

    let href = acc
    if (
      chartPatientId &&
      segments[0] === 'charting' &&
      segments.length > 1 &&
      acc === '/charting' &&
      !isLast
    ) {
      href = `/patients/${encodeURIComponent(chartPatientId)}?tab=charting`
    }

    items.push({ href, label, current: isLast })
  }

  return items
}

export default function AppBreadcrumbs() {
  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()
  const chartPatientId = searchParams.get('patientId')
  const items = getBreadcrumbItems(pathname, { chartPatientId })

  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol
        className="flex flex-wrap items-center gap-1 text-[13px]"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        {items.map((item, i) => (
          <li key={`${item.href}-${i}`} className="flex items-center gap-1 min-w-0">
            {i > 0 ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden />
            ) : null}
            {item.current ? (
              <span
                className="font-semibold text-slate-900 truncate"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-teal-700 hover:text-teal-800 hover:underline truncate"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
