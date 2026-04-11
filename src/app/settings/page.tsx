import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single()

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Update your profile and account</p>
          </div>
          <SettingsForm
            currentDisplayName={profile?.display_name ?? profile?.username ?? ''}
            currentUsername={profile?.username ?? ''}
          />
        </div>
      </main>
    </>
  )
}
