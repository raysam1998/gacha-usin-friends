import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import PullMachine from './PullMachine'

export default async function PullPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, configRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('tokens, pity_counter').eq('id', user.id).single(),
    supabaseAdmin.from('gacha_config').select('pull_cost, pity_threshold').single(),
  ])

  const profile = profileRes.data
  const config = configRes.data

  return (
    <>
      <Navbar />
      <div className="pt-14">
        <PullMachine
          initialTokens={profile?.tokens ?? 0}
          initialPity={profile?.pity_counter ?? 0}
          pityThreshold={config?.pity_threshold ?? 50}
          pullCost={config?.pull_cost ?? 1}
        />
      </div>
    </>
  )
}
