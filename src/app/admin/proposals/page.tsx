import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminProposalCard from './AdminProposalCard'

export default async function AdminProposalsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const { data: proposals } = await supabaseAdmin
    .from('card_proposals')
    .select(`
      *,
      proposer:profiles!proposed_by(username, display_name),
      character:characters(name),
      proposal_votes(vote, voted_rarity, user_id)
    `)
    .order('created_at', { ascending: false })

  const voting = proposals?.filter(p => p.status === 'voting') ?? []
  const decided = proposals?.filter(p => p.status !== 'voting') ?? []

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-2xl mx-auto px-4 py-10">

          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Admin</Link>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Proposals Review</h1>
          <p className="text-gray-500 text-sm mb-8">Approve to create cards, reject with a note</p>

          {/* Needs decision */}
          {voting.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3">
                Needs Decision ({voting.length})
              </h2>
              <div className="space-y-3">
                {voting.map(p => <AdminProposalCard key={p.id} proposal={p} />)}
              </div>
            </section>
          )}

          {voting.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm mb-8">
              No pending proposals.
            </div>
          )}

          {/* Decided */}
          {decided.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                Decided ({decided.length})
              </h2>
              <div className="space-y-3">
                {decided.map(p => <AdminProposalCard key={p.id} proposal={p} />)}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
