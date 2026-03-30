import { requireSession } from '@/lib/auth/session'
import ProfileForm from '@/components/settings/ProfileForm'

export default async function SettingsProfilePage() {
  const session = await requireSession()
  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-1">
        My Profile
      </h1>
      <p className="text-sm text-[#717182] mb-6">Update your name and password.</p>
      <ProfileForm session={session} />
    </div>
  )
}
