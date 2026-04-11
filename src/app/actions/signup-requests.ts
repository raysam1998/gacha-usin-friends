'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { CreateUserState } from './admin'

export type SignupRequestState = { error: string | null; success: string | null }

export async function submitSignupRequestAction(
  prevState: SignupRequestState | null,
  formData: FormData
): Promise<SignupRequestState> {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const displayName = (formData.get('display_name') as string)?.trim() || username
  const message = (formData.get('message') as string)?.trim() || null

  if (!username) return { error: 'Username required', success: null }
  if (username.length < 3) return { error: 'Min 3 characters', success: null }
  if (!/^[a-z0-9_]+$/.test(username)) return { error: 'Only letters, numbers, underscores', success: null }

  // Check not already a user
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (existing) return { error: 'Username already taken', success: null }

  // Check not already a pending request
  const { data: existingReq } = await supabaseAdmin
    .from('signup_requests')
    .select('id, status')
    .eq('username', username)
    .maybeSingle()

  if (existingReq) {
    if (existingReq.status === 'pending') return { error: 'Request already submitted, wait for admin approval', success: null }
    if (existingReq.status === 'approved') return { error: 'This username is already approved', success: null }
  }

  const { error } = await supabaseAdmin.from('signup_requests').upsert(
    { username, display_name: displayName, message, status: 'pending' },
    { onConflict: 'username' }
  )
  if (error) return { error: error.message, success: null }

  return { error: null, success: 'Request submitted! Rayan will review it soon.' }
}

export async function approveSignupAction(
  prevState: CreateUserState | null,
  formData: FormData
): Promise<CreateUserState> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: null, credentials: null }

  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Not admin', success: null, credentials: null }

  const requestId = formData.get('request_id') as string
  const customPassword = (formData.get('password') as string)?.trim()

  const { data: req } = await supabaseAdmin
    .from('signup_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!req) return { error: 'Request not found', success: null, credentials: null }

  function genPassword(len = 12) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const password = customPassword || genPassword()

  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `${req.username}@gacha.local`,
    password,
    email_confirm: true,
    user_metadata: { username: req.username, display_name: req.display_name || req.username },
  })

  if (authError) return { error: authError.message, success: null, credentials: null }

  await supabaseAdmin.from('signup_requests').update({ status: 'approved' }).eq('id', requestId)

  revalidatePath('/admin/signups')
  return { error: null, success: 'Approved!', credentials: { username: req.username, password } }
}

export async function rejectSignupAction(
  prevState: SignupRequestState | null,
  formData: FormData
): Promise<SignupRequestState> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: null }

  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Not admin', success: null }

  const requestId = formData.get('request_id') as string
  const adminNote = (formData.get('admin_note') as string)?.trim() || null

  const { error } = await supabaseAdmin
    .from('signup_requests')
    .update({ status: 'rejected', admin_note: adminNote })
    .eq('id', requestId)

  if (error) return { error: error.message, success: null }
  revalidatePath('/admin/signups')
  return { error: null, success: 'Rejected' }
}
