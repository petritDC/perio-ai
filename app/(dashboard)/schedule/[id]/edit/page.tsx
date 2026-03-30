import { notFound } from 'next/navigation'
import { getAppointment } from '@/lib/queries/appointment.queries'
import { getStaffMembers } from '@/lib/queries/staff.queries'
import { getPatients } from '@/lib/queries/patient.queries'
import AppointmentForm from '@/components/schedule/AppointmentForm'

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [appointment, staffResult, patientsResult] = await Promise.all([
    getAppointment(id),
    getStaffMembers(),
    getPatients({}),
  ])

  if (!appointment) notFound()

  const providers = staffResult.filter((s) =>
    ['dentist', 'hygienist'].includes(s.role)
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        Edit Appointment
      </h1>
      <AppointmentForm
        appointment={appointment}
        providers={providers}
        patients={patientsResult.data}
      />
    </div>
  )
}
