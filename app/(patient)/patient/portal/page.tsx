import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getPatientIntake } from '@/lib/queries/patient-intake.queries'
import { getPatientAppointments } from '@/lib/actions/patient-portal.actions'
import { AppointmentRequestForm } from '@/components/patient/AppointmentRequestForm'
import { Stethoscope, Pencil, CalendarDays, User, Pill, Phone, AlertTriangle, ClipboardList } from 'lucide-react'

const card = 'bg-white rounded-2xl p-6 border border-[#E4E7EE]'
const cardStyle = { boxShadow: 'var(--shadow-card)' }
const chip = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    requested: 'bg-amber-50 text-amber-700 border-amber-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
    completed: 'bg-slate-50 text-slate-600 border-slate-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    no_show: 'bg-orange-50 text-orange-600 border-orange-200',
  }
  return (
    <span className={`${chip} ${map[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default async function PatientPortalPage() {
  const session = await getSession()
  if (!session || session.role !== 'patient') redirect('/patient/login')

  const [intake, appointments] = await Promise.all([
    getPatientIntake(session.id),
    getPatientAppointments(),
  ])

  const p = intake?.personal_info ?? null
  const allergies: string[] = intake?.allergies ?? []
  const meds: { name: string; dosage: string; frequency: string }[] = intake?.current_medications ?? []
  const contacts: { name: string; phone: string; relationship: string }[] = intake?.emergency_contacts ?? []
  const history: { condition: string; diagnosedAt: string; notes: string }[] = intake?.medical_history ?? []

  const upcomingAppointments = appointments.filter(
    (a) => !['completed', 'cancelled', 'no_show'].includes(a.status)
  )

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <header className="h-16 bg-white flex items-center justify-between px-8 sticky top-0 z-10" style={{ borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>PerioAI</span>
        </div>
        <span className="text-[13px] text-slate-500">{session.email}</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>
              {p?.fullName ?? session.fullName ?? 'Welcome'}
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Your patient portal</p>
          </div>
          <Link
            href="/patient/intake"
            className="flex items-center gap-1.5 text-[12px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-xl transition-colors"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit My Info
          </Link>
        </div>

        {/* No intake yet */}
        {!intake && (
          <div className={card} style={cardStyle}>
            <p className="text-[14px] text-slate-600 mb-3">Please complete your intake form before your first appointment.</p>
            <Link
              href="/patient/intake"
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Complete Intake Form
            </Link>
          </div>
        )}

        {/* ── Personal Information ── */}
        {p && (
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-teal-600" />
              <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>Personal Information</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              {[
                { label: 'Date of Birth', value: p.dateOfBirth },
                { label: 'Age', value: p.age ? `${p.age} years` : '—' },
                { label: 'Email', value: p.patientEmail || '—' },
                { label: 'Blood Type', value: p.bloodType || '—' },
                { label: 'Insurance', value: p.insurance || '—' },
                { label: 'National ID', value: p.patientNationalId || '—' },
                { label: 'Medical Record No.', value: p.medicalRecordNumber || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-[13px] text-slate-800 font-medium mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Allergies ── */}
        {allergies.length > 0 && (
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>Allergies</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((a, i) => (
                <span key={i} className="bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-medium px-3 py-1 rounded-full">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Medical History ── */}
        {history.length > 0 && (
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-teal-600" />
              <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>Medical History</h2>
            </div>
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="flex gap-4 border-b border-[#F0F3F8] pb-3 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-slate-800">{h.condition}</p>
                    {h.notes && <p className="text-[12px] text-slate-500 mt-0.5">{h.notes}</p>}
                  </div>
                  {h.diagnosedAt && (
                    <p className="text-[11px] text-slate-400 shrink-0 mt-0.5">{h.diagnosedAt}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Current Medications ── */}
        {meds.length > 0 && (
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-4 h-4 text-teal-600" />
              <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>Current Medications</h2>
            </div>
            <div className="space-y-3">
              {meds.map((m, i) => (
                <div key={i} className="flex items-start justify-between gap-4 border-b border-[#F0F3F8] pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{m.name}</p>
                    <p className="text-[12px] text-slate-500">{m.dosage} · {m.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Emergency Contacts ── */}
        {contacts.length > 0 && (
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-teal-600" />
              <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>Emergency Contacts</h2>
            </div>
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{c.name}</p>
                    <p className="text-[12px] text-slate-500">{c.relationship}</p>
                  </div>
                  <a href={`tel:${c.phone}`} className="text-[13px] text-teal-600 hover:underline font-medium">{c.phone}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Request Appointment ── */}
        <div className={card} style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-4 h-4 text-teal-600" />
            <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>Request an Appointment</h2>
          </div>
          <AppointmentRequestForm />
        </div>

        {/* ── Upcoming Appointments ── */}
        {upcomingAppointments.length > 0 && (
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>My Appointments</h2>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between gap-4 border-b border-[#F0F3F8] pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{appt.title}</p>
                    <p className="text-[12px] text-slate-500">
                      {new Date(appt.start_time).toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(appt.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
