import { describe, expect, it } from 'vitest'
import { getBreadcrumbItems } from '@/components/shell/AppBreadcrumbs'

describe('getBreadcrumbItems', () => {
  it('dashboard home hides breadcrumbs', () => {
    expect(getBreadcrumbItems('/dashboard')).toEqual([])
  })

  it('patients list', () => {
    expect(getBreadcrumbItems('/patients')).toEqual([
      { href: '/dashboard', label: 'Dashboard', current: false },
      { href: '/patients', label: 'Patients', current: true },
    ])
  })

  it('patient profile uses generic patient label for id segment', () => {
    const items = getBreadcrumbItems('/patients/550e8400-e29b-41d4-a716-446655440000')
    expect(items).toHaveLength(3)
    expect(items[2]).toMatchObject({ label: 'Patient', current: true })
  })

  it('schedule matches sidebar copy as Appointments', () => {
    expect(getBreadcrumbItems('/schedule').at(-1)).toMatchObject({
      label: 'Appointments',
      current: true,
    })
  })

  it('charting crumb links to patient charting tab when patientId is provided', () => {
    const pid = '550e8400-e29b-41d4-a716-446655440000'
    const chartId = '660e8400-e29b-41d4-a716-446655440099'
    const items = getBreadcrumbItems(`/charting/${chartId}`, { chartPatientId: pid })
    const chartingCrumb = items.find((c) => c.label === 'Charting')
    expect(chartingCrumb).toMatchObject({
      href: `/patients/${pid}?tab=charting`,
      current: false,
    })
  })
})
