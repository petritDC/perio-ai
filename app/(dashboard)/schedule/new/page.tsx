import { getStaffMembers } from '@/lib/queries/staff.queries'
import { getPatients } from '@/lib/queries/patient.queries'
import AppointmentForm from '@/components/schedule/AppointmentForm'

export default async function NewAppointmentPage() {
  const [staffResult, patientsResult] = await Promise.all([
    getStaffMembers(),
    getPatients({}),
  ])

  const providers = staffResult.filter((s) =>
    ['dentist', 'hygienist'].includes(s.role)
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        New Appointment
      </h1>
      <AppointmentForm providers={providers} patients={patientsResult.data} />
    </div>
  )
}
