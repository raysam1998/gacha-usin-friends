import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import SignupRequestCard from './SignupRequestCard'

export default async function AdminSignupsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const { data: requests } = await supabaseAdmin
    .from('signup_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const pending = (requests ?? []).filter(r => r.status === 'pending')
  const done = (requests ?? []).filter(r => r.status !== 'pending')

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/admin" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">← Admin</Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-2xl font-black text-white">Signup Requests</h1>
            {pending.length > 0 && (
              <span className="bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 && done.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-20">No signup requests yet.</p>
          )}

          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">
                Pending ({pending.length})
              </h2>
              <div className="space-y-4">
                {pending.map(req => <SignupRequestCard key={req.id} req={req} />)}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">
                Reviewed ({done.length})
              </h2>
              <div className="space-y-3">
                {done.map(req => <SignupRequestCard key={req.id} req={req} />)}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
