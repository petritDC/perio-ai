import Link from 'next/link'
import { Stethoscope, Shield, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const soraFont = 'var(--font-sora)'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-8 bg-white" style={{ borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="text-[16px] font-semibold text-slate-900" style={{ fontFamily: soraFont }}>PerioAI</span>
        </div>
        <Link href="/login">
          <Button variant="ghost" className="text-[13px] font-medium text-slate-600 hover:text-slate-900 h-9" style={{ fontFamily: soraFont }}>
            Staff Login
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[12px] font-semibold mb-6" style={{ fontFamily: soraFont }}>
          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
          Periodontal Practice Management
        </div>

        <h1 className="text-[48px] font-bold text-slate-900 leading-tight tracking-tight mb-6" style={{ fontFamily: soraFont }}>
          Your periodontal health,<br />
          <span className="text-teal-600">managed with precision.</span>
        </h1>

        <p className="text-[18px] text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Complete your patient intake form before your first appointment. Secure, fast, and designed to give your periodontist a complete clinical picture.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/patient/register">
            <Button className="h-12 px-8 bg-teal-600 hover:bg-teal-700 text-[14px] font-semibold rounded-xl" style={{ fontFamily: soraFont }}>
              Complete Patient Intake
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/patient/login">
            <Button variant="outline" className="h-12 px-8 text-[14px] font-medium rounded-xl border-[#E4E7EE] text-slate-700 hover:bg-slate-50" style={{ fontFamily: soraFont }}>
              Returning Patient
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-3 gap-5">
          {[
            { icon: Shield, title: 'Secure Records', desc: 'Your medical information is encrypted and stored securely. Only your care team has access.' },
            { icon: Stethoscope, title: 'Digital Intake Form', desc: 'Complete your full medical history, medications, allergies, and risk factors online before your visit.' },
            { icon: Calendar, title: 'Fast Appointments', desc: 'Pre-submitted intake data means your periodontist is fully prepared before you arrive.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-2" style={{ fontFamily: soraFont }}>{title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4E7EE] bg-white py-6 px-8 text-center">
        <p className="text-[12px] text-slate-400">© 2026 PerioAI PMS. All rights reserved.</p>
      </footer>
    </div>
  )
}
