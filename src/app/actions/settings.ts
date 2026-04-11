'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type SettingsState = { error: string | null; success: string | null }

async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function updateDisplayNameAction(
  prevState: SettingsState | null,
  formData: FormData
): Promise<SettingsState> {
  let user
  try { user = await getUser() } catch { return { error: 'Not authenticated', success: null } }

  const displayName = (formData.get('display_name') as string)?.trim()
  if (!displayName) return { error: 'Display name required', success: null }
  if (displayName.length > 32) return { error: 'Max 32 characters', success: null }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) return { error: error.message, success: null }
  revalidatePath('/settings')
  revalidatePath('/')
  return { error: null, success: 'Display name updated!' }
}

export async function updateUsernameAction(
  prevState: SettingsState | null,
  formData: FormData
): Promise<SettingsState> {
  let user
  try { user = await getUser() } catch { return { error: 'Not authenticated', success: null } }

  const newUsername = (formData.get('username') as string)?.trim().toLowerCase()
  if (!newUsername) return { error: 'Username required', success: null }
  if (newUsername.length < 3) return { error: 'Min 3 characters', success: null }
  if (newUsername.length > 24) return { error: 'Max 24 characters', success: null }
  if (!/^[a-z0-9_]+$/.test(newUsername)) return { error: 'Only letters, numbers, underscores', success: null }

  // Check if taken
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', newUsername)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Username already taken', success: null }

  // Update auth email (username is the email prefix)
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email: `${newUsername}@gacha.local`,
  })
  if (authError) return { error: `Auth update failed: ${authError.message}`, success: null }

  // Update profile
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id)

  if (error) return { error: error.message, success: null }
  revalidatePath('/settings')
  return { error: null, success: 'Username updated!' }
}

export async function updatePasswordAction(
  prevState: SettingsState | null,
  formData: FormData
): Promise<SettingsState> {
  let user
  try { user = await getUser() } catch { return { error: 'Not authenticated', success: null } }

  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword) return { error: 'New password required', success: null }
  if (newPassword.length < 6) return { error: 'Min 6 characters', success: null }
  if (newPassword !== confirmPassword) return { error: 'Passwords do not match', success: null }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (error) return { error: error.message, success: null }
  return { error: null, success: 'Password updated!' }
}
