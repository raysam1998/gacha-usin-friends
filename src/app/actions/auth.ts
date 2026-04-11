'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function loginAction(
  prevState: { error: string | null },
  formData: FormData
) {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username and password are required.' }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: `${username}@gacha.local`,
    password,
  })

  if (error) {
    return { error: 'Wrong username or password.' }
  }

  redirect('/')
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
