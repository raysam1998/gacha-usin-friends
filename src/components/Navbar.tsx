import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import LogoutButton from './LogoutButton'
import TokenTimer from './TokenTimer'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [profileRes, configRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('username, display_name, is_admin, tokens, last_token_refresh, last_bonus_token_at')
      .eq('id', user.id)
      .single(),
    supabaseAdmin
      .from('gacha_config')
      .select('daily_tokens, bonus_token_amount, bonus_token_interval_hours, auto_approve_votes')
      .single(),
  ])

  const profile = profileRes.data
  const config = configRes.data

  if (profile) {
    const now = new Date()
    const updates: Record<string, unknown> = {}
    let newTokens = profile.tokens

    // Daily reset
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    if (new Date(profile.last_token_refresh) < startOfToday) {
      newTokens = config?.daily_tokens ?? 10
      updates.last_token_refresh = now.toISOString()
    }

    // Bonus token drip
    const bonusAmount = config?.bonus_token_amount ?? 0
    const bonusIntervalHours = Number(config?.bonus_token_interval_hours ?? 0)
    if (bonusAmount > 0 && bonusIntervalHours > 0) {
      const intervalMs = bonusIntervalHours * 60 * 60 * 1000
      const lastBonus = profile.last_bonus_token_at
        ? new Date(profile.last_bonus_token_at)
        : new Date(0)
      if (now.getTime() - lastBonus.getTime() >= intervalMs) {
        newTokens += bonusAmount
        updates.last_bonus_token_at = now.toISOString()
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.tokens = newTokens
      await supabaseAdmin.from('profiles').update(updates).eq('id', user.id)
      profile.tokens = newTokens
      if (updates.last_bonus_token_at) {
        profile.last_bonus_token_at = updates.last_bonus_token_at as string
      }
    }
  }

  const bonusAmount = Number(config?.bonus_token_amount ?? 0)
  const bonusIntervalHours = Number(config?.bonus_token_interval_hours ?? 0)

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
        <div className="flex items-center gap-2">
          {/* Token count */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
            <span className="text-sm">🪙</span>
            <span className="text-amber-400 font-bold text-sm">
              {profile?.tokens ?? 0}
            </span>
          </div>

          {/* Countdown timer — client component */}
          <TokenTimer
            lastBonusAt={profile?.last_bonus_token_at ?? null}
            intervalHours={bonusIntervalHours}
            bonusAmount={bonusAmount}
            dailyTokens={Number(config?.daily_tokens ?? 10)}
          />

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
          <Link href="/catalog" className="text-gray-400 hover:text-violet-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 hidden sm:block">
            catalog
          </Link>
          <Link href="/proposals" className="text-gray-400 hover:text-violet-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 hidden sm:block">
            proposals
          </Link>
          <Link href="/settings" className="text-gray-400 hover:text-violet-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 hidden sm:block">
            settings
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
