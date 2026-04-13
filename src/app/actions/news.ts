'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type NewsSubmitState = {
  error: string | null
  success: string | null
  cooldownSecsLeft?: number
}

export async function submitNewsMessageAction(
  prevState: NewsSubmitState | null,
  formData: FormData
): Promise<NewsSubmitState> {
  // ── Auth ──────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in', success: null }

  // ── Check feature enabled ─────────────────────────────────────
  const { data: cfg } = await supabaseAdmin
    .from('gacha_config')
    .select('user_news_enabled, user_news_cooldown_minutes, user_news_auto_active')
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = cfg as any
  if (!config?.user_news_enabled) {
    return { error: 'User submissions are currently disabled.', success: null }
  }

  const cooldownMs = (config.user_news_cooldown_minutes ?? 5) * 60 * 1000

  // ── Rate limit check ──────────────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('last_news_submission_at')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSubmit: string | null = (profile as any)?.last_news_submission_at ?? null
  if (lastSubmit) {
    const elapsed = Date.now() - new Date(lastSubmit).getTime()
    if (elapsed < cooldownMs) {
      const secsLeft = Math.ceil((cooldownMs - elapsed) / 1000)
      return {
        error: `Slow down — you can submit again in ${secsLeft}s.`,
        success: null,
        cooldownSecsLeft: secsLeft,
      }
    }
  }

  // ── Validate message ──────────────────────────────────────────
  const raw = formData.get('message') as string
  const message = raw?.trim()
  if (!message)          return { error: 'Message cannot be empty.', success: null }
  if (message.length > 280) return { error: 'Max 280 characters.', success: null }

  // ── Insert ────────────────────────────────────────────────────
  const active: boolean = config.user_news_auto_active ?? false

  const { error: insertErr } = await supabaseAdmin
    .from('news_messages')
    .insert({ message, active, submitted_by: user.id })

  if (insertErr) return { error: insertErr.message, success: null }

  // ── Update last submission time ───────────────────────────────
  await supabaseAdmin
    .from('profiles')
    .update({ last_news_submission_at: new Date().toISOString() })
    .eq('id', user.id)

  const note = active
    ? 'Message submitted — it\'s live!'
    : 'Message submitted — pending admin approval.'

  return { error: null, success: note }
}
