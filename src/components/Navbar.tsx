import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import LogoutButton from './LogoutButton'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Check + run daily token refresh
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('username, display_name, is_admin, tokens, last_token_refresh')
    .eq('id', user.id)
    .single()

  if (profile) {
    const lastRefresh = new Date(profile.last_token_refresh)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    if (lastRefresh < startOfToday) {
      const { data: config } = await supabaseAdmin
        .from('gacha_config')
        .select('daily_tokens')
        .single()

      await supabaseAdmin
        .from('profiles')
        .update({
          tokens: config?.daily_tokens ?? 10,
          last_token_refresh: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profile) profile.tokens = config?.daily_tokens ?? 10
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#08080f]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl">🎴</span>
          <span className="font-black text-sm tracking-widest text-gradient hidden sm:block">
            GUF
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Token count */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
            <span className="text-sm">🪙</span>
            <span className="text-amber-400 font-bold text-sm">
              {profile?.tokens ?? 0}
            </span>
          </div>

          {/* Username */}
          <span className="text-gray-300 text-sm font-medium hidden sm:block">
            {profile?.display_name ?? profile?.username ?? 'unknown'}
          </span>

          {/* Nav links */}
          <Link href="/pull" className="text-gray-400 hover:text-violet-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10">
            pull
          </Link>
          <Link href="/collection" className="text-gray-400 hover:text-violet-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 hidden sm:block">
            collection
          </Link>
          <Link href="/proposals" className="text-gray-400 hover:text-violet-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 hidden sm:block">
            proposals
          </Link>

          {/* Admin badge */}
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-bold px-3 py-1 rounded-full hover:bg-violet-600/30 transition-colors"
            >
              ADMIN
            </Link>
          )}

          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
