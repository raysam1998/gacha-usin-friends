'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type AdminState = {
  error: string | null
  success: string | null
}

export type CreateUserState = {
  error: string | null
  success: string | null
  credentials: { username: string; password: string } | null
}

// ── Guard ─────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Not admin')
}

// ── Characters ────────────────────────────────────────────────
export async function createCharacterAction(
  prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null }
  }

  const name = (formData.get('name') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim() || null

  if (!name) return { error: 'Name is required', success: null }

  const { error } = await supabaseAdmin.from('characters').insert({ name, bio })
  if (error) return { error: error.message, success: null }

  revalidatePath('/admin')
  return { error: null, success: `Character "${name}" created!` }
}

export async function deleteCharacterAction(
  prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null }
  }

  const id = formData.get('id') as string
  const { error } = await supabaseAdmin.from('characters').delete().eq('id', id)
  if (error) return { error: error.message, success: null }

  revalidatePath('/admin')
  return { error: null, success: 'Deleted' }
}

// ── Cards ─────────────────────────────────────────────────────
export async function createCardAction(
  prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null }
  }

  const characterId = formData.get('character_id') as string
  const variantName = (formData.get('variant_name') as string)?.trim()
  const rarity = formData.get('rarity') as string
  const imageFile = formData.get('image') as File

  if (!characterId || !variantName || !rarity)
    return { error: 'All fields are required', success: null }

  if (!imageFile || imageFile.size === 0)
    return { error: 'Image is required', success: null }

  const fileExt = imageFile.name.split('.').pop() ?? 'jpg'
  const fileName = `cards/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('card-images')
    .upload(fileName, imageFile, { contentType: imageFile.type })

  if (uploadError) return { error: `Upload failed: ${uploadError.message}`, success: null }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('card-images')
    .getPublicUrl(uploadData.path)

  const { error } = await supabaseAdmin.from('cards').insert({
    character_id: characterId,
    variant_name: variantName,
    rarity,
    image_url: publicUrl,
  })

  if (error) return { error: error.message, success: null }

  revalidatePath('/admin')
  return { error: null, success: `Card "${variantName}" created!` }
}

export async function deleteCardAction(
  prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null }
  }

  const id = formData.get('id') as string
  const { error } = await supabaseAdmin.from('cards').delete().eq('id', id)
  if (error) return { error: error.message, success: null }

  revalidatePath('/admin')
  return { error: null, success: 'Deleted' }
}

// ── Users ─────────────────────────────────────────────────────
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pw = ''
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

export async function createUserAction(
  prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null, credentials: null }
  }

  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const displayName = (formData.get('display_name') as string)?.trim() || username
  const customPassword = (formData.get('password') as string)?.trim()
  const password = customPassword || generatePassword()

  if (!username) return { error: 'Username required', success: null, credentials: null }
  if (username.length < 3) return { error: 'Username must be at least 3 chars', success: null, credentials: null }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: `${username}@gacha.local`,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
  })

  if (error) return { error: error.message, success: null, credentials: null }

  revalidatePath('/admin')
  return {
    error: null,
    success: 'User created!',
    credentials: { username, password },
  }
}

export async function deleteUserAction(
  prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null }
  }

  const id = formData.get('id') as string
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return { error: error.message, success: null }

  revalidatePath('/admin')
  return { error: null, success: 'User deleted' }
}

export async function editUserAction(
  prevState: AdminState | null,
  formData: FormData
): Promise<AdminState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null }
  }

  const id = formData.get('id') as string
  const displayName = (formData.get('display_name') as string)?.trim() || null
  const newUsername = (formData.get('username') as string)?.trim().toLowerCase()
  const tokens = parseInt(formData.get('tokens') as string, 10)
  const isAdmin = formData.get('is_admin') === 'true'  // unchecked checkbox won't be in FormData
  const resetPity = formData.get('reset_pity') === 'true'

  if (!newUsername || newUsername.length < 3) return { error: 'Username too short', success: null }
  if (isNaN(tokens) || tokens < 0) return { error: 'Invalid token count', success: null }

  // Check username uniqueness (excluding current user)
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', newUsername)
    .neq('id', id)
    .maybeSingle()
  if (existing) return { error: 'Username already taken', success: null }

  // Update auth email if username changed
  const { data: current } = await supabaseAdmin.from('profiles').select('username').eq('id', id).single()
  if (current?.username !== newUsername) {
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: `${newUsername}@gacha.local`,
    })
    if (authErr) return { error: `Auth update failed: ${authErr.message}`, success: null }
  }

  const updates: Record<string, unknown> = { display_name: displayName, username: newUsername, tokens, is_admin: isAdmin }
  if (resetPity) updates.pity_counter = 0

  const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', id)
  if (error) return { error: error.message, success: null }

  revalidatePath('/admin')
  return { error: null, success: 'User updated' }
}

export async function resetUserPasswordAction(
  prevState: AdminState | null,
  formData: FormData
): Promise<AdminState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized', success: null }
  }

  const id = formData.get('id') as string
  const password = (formData.get('password') as string)?.trim()

  if (!password || password.length < 6) return { error: 'Min 6 characters', success: null }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password })
  if (error) return { error: error.message, success: null }

  return { error: null, success: 'Password updated' }
}
