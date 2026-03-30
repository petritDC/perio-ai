'use client'

import { useState } from 'react'
import { requestAppointment } from '@/lib/actions/patient-portal.actions'
import { CheckCircle2 } from 'lucide-react'

const inputCls =
  'w-full rounded-lg border border-[#E4E7EE] bg-white text-slate-800 text-[13px] px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors placeholder:text-slate-400'
const labelCls = 'block text-[12px] text-slate-500 font-medium mb-1'

export function AppointmentRequestForm() {
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('09:00')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit() {
    if (!preferredDate || !reason.trim()) {
      setError('Please fill in the date and reason.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const result = await requestAppointment({ preferredDate, preferredTime, reason: reason.trim() })
      if (!result.success) {
        setError(result.error ?? 'Could not submit request.')
        return
      }
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-4">
        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-teal-800">Appointment request sent</p>
          <p className="text-[12px] text-teal-600 mt-0.5">Our team will contact you to confirm.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Preferred Date</label>
          <input
            type="date"
            className={inputCls}
            min={today}
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Preferred Time</label>
          <select
            className={inputCls}
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          >
            {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
              '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Reason for Visit</label>
        <input
          className={inputCls}
          placeholder="e.g. Routine periodontal check-up, tooth pain…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-[12px] text-red-600 font-medium">{error}</p>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmit}
        className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        {submitting ? 'Sending…' : 'Request Appointment'}
      </button>
    </div>
  )
}
