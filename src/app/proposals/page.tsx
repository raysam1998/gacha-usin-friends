import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import SubmitProposalForm from './SubmitProposalForm'
import ProposalCard from './ProposalCard'

export default async function ProposalsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: characters }, { data: proposals }] = await Promise.all([
    supabaseAdmin.from('characters').select('id, name').order('name'),
    supabaseAdmin
      .from('card_proposals')
      .select(`
        *,
        proposer:profiles!proposed_by(username, display_name),
        character:characters(name),
        proposal_votes(vote, voted_rarity, user_id)
      `)
      .order('created_at', { ascending: false }),
  ])

  const voting = proposals?.filter(p => p.status === 'voting') ?? []
  const decided = proposals?.filter(p => p.status !== 'voting') ?? []

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-2xl mx-auto px-4 py-10">

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-1">Card Proposals</h1>
            <p className="text-gray-500 text-sm">Submit ideas, vote on community picks</p>
          </div>

          <div className="mb-8">
            <SubmitProposalForm characters={characters ?? []} />
          </div>

          {/* Voting */}
          {voting.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                Open for Voting ({voting.length})
              </h2>
              <div className="space-y-3">
                {voting.map(p => (
                  <ProposalCard key={p.id} proposal={p} currentUserId={user.id} />
                ))}
              </div>
            </section>
          )}

          {/* Decided */}
          {decided.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                Decided ({decided.length})
              </h2>
              <div className="space-y-3">
                {decided.map(p => (
                  <ProposalCard key={p.id} proposal={p} currentUserId={user.id} />
                ))}
              </div>
            </section>
          )}

          {(proposals?.length ?? 0) === 0 && (
            <div className="text-center py-16 text-gray-600 text-sm">
              No proposals yet. Be the first!
            </div>
          )}
        </div>
      </main>
    </>
  )
}
