import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CharactersManager from './CharactersManager'
import UsersManager from './UsersManager'
import GachaConfigManager from './GachaConfigManager'
import AdminNewsTicker from '@/components/AdminNewsTicker'

export default async function AdminPage() {
  // Auth + admin guard
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  // Pending signup requests count
  const { count: pendingSignups } = await supabaseAdmin
    .from('signup_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Fetch characters with their cards
  const { data: characters } = await supabaseAdmin
    .from('characters')
    .select('*, cards(*)')
    .order('created_at', { ascending: true })

  // Fetch all users
  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  // Fetch gacha config
  const { data: gachaConfig } = await supabaseAdmin
    .from('gacha_config')
    .select('daily_tokens, bonus_token_amount, bonus_token_interval_hours, auto_approve_votes, user_news_enabled, user_news_cooldown_minutes, user_news_auto_active')
    .single()

  const charactersWithCards = (characters ?? []).map((c) => ({
    ...c,
    cards: (c.cards ?? []).sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">⚙️</span>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Admin Panel
              </h1>
            </div>
            <p className="text-gray-500 text-sm ml-12">
              Manage characters, cards, and users
            </p>
          </div>

          {/* Characters section */}
          <div className="mb-10">
            <CharactersManager characters={charactersWithCards} />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 mb-10" />

          {/* Users section */}
          <UsersManager users={users ?? []} />

          {/* Divider */}
          <div className="border-t border-gray-800 my-10" />

          {/* Proposals link */}
          <div className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <div className="text-white font-bold text-sm">Card Proposals</div>
                <div className="text-gray-400 text-xs">Review community-submitted card ideas</div>
              </div>
            </div>
            <Link href="/admin/proposals" className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              Review
            </Link>
          </div>

          {/* News ticker manager */}
          <AdminNewsTicker />

          <div className="border-t border-gray-800 my-4" />

          {/* Gacha config */}
          <GachaConfigManager config={{
            daily_tokens: gachaConfig?.daily_tokens ?? 10,
            bonus_token_amount: gachaConfig?.bonus_token_amount ?? 0,
            bonus_token_interval_hours: Number(gachaConfig?.bonus_token_interval_hours ?? 0),
            auto_approve_votes: gachaConfig?.auto_approve_votes ?? 4,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_news_enabled: (gachaConfig as any)?.user_news_enabled ?? false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_news_cooldown_minutes: (gachaConfig as any)?.user_news_cooldown_minutes ?? 5,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_news_auto_active: (gachaConfig as any)?.user_news_auto_active ?? false,
          }} />

          <div className="border-t border-gray-800 my-4" />

          {/* Signup requests link */}
          <div className="glass rounded-xl p-4 flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🙋</span>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-white font-bold text-sm">Signup Requests</div>
                  {(pendingSignups ?? 0) > 0 && (
                    <span className="bg-amber-500 text-black text-xs font-black px-1.5 py-0.5 rounded-full leading-none">
                      {pendingSignups}
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-xs">Approve or reject new account requests</div>
              </div>
            </div>
            <Link href="/admin/signups" className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              Review
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}
