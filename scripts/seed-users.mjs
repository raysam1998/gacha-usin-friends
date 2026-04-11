// One-time script to create the friend group accounts.
// Run with: node --env-file=.env.local scripts/seed-users.mjs

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const users = [
  { username: 'liloush', display_name: 'Liloush', password: 'liloushpw' },
  { username: 'adlan',   display_name: 'Adlan',   password: 'adlanpw'   },
  { username: 'yano',    display_name: 'Yano',    password: 'yanopw'    },
  { username: 'hano',    display_name: 'Hano',    password: 'hanopw'    },
]

for (const u of users) {
  const { error } = await supabase.auth.admin.createUser({
    email: `${u.username}@gacha.local`,
    password: u.password,
    email_confirm: true,
    user_metadata: { username: u.username, display_name: u.display_name },
  })
  if (error) console.error(`✗ ${u.username}: ${error.message}`)
  else       console.log(`✓ ${u.username} created (pw: ${u.password})`)
}
