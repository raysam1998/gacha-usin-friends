'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { voteAction } from '@/app/actions/proposals'

type Vote = { vote: string; voted_rarity: string; user_id: string }
type Proposal = {
  id: string
  variant_name: string
  image_url: string
  proposed_rarity: string
  status: string
  admin_note: string | null
  created_at: string
  character: { name: string } | null
  new_character_name: string | null
  proposer: { username: string; display_name: string | null } | null
  proposal_votes: Vote[]
}

const rarityBadge: Record<string, string> = {
  common: 'bg-gray-800 text-gray-300 border-gray-600',
  rare: 'bg-blue-900/50 text-blue-300 border-blue-600',
  epic: 'bg-purple-900/50 text-purple-300 border-purple-600',
  legendary: 'bg-amber-900/50 text-amber-300 border-amber-600',
}
const rarityBtn: Record<string, string> = {
  common: 'border-gray-600 text-gray-400',
  rare: 'border-blue-600 text-blue-400',
  epic: 'border-purple-600 text-purple-400',
  legendary: 'border-amber-600 text-amber-400',
}
const rarityBtnSelected: Record<string, string> = {
  common: 'bg-gray-700 border-gray-400 text-white',
  rare: 'bg-blue-800 border-blue-400 text-white',
  epic: 'bg-purple-800 border-purple-400 text-white',
  legendary: 'bg-amber-800 border-amber-400 text-white',
}
const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const

// ── Vote sub-form ─────────────────────────────────────────────
function VoteForm({
  proposalId,
  userVote,
  onCancel,
}: {
  proposalId: string
  userVote: Vote | null
  onCancel: () => void
}) {
  const [state, action, pending] = useActionState(voteAction, { error: null, success: null })
  const [selectedVote, setSelectedVote] = useState<'approve' | 'reject'>(
    (userVote?.vote as 'approve' | 'reject') ?? 'approve'
  )
  const [selectedRarity, setSelectedRarity] = useState<string>(userVote?.voted_rarity ?? 'common')

  if (state.success) return <div className="text-green-400 text-xs py-2">✓ Vote saved!</div>

  return (
    <form action={action} className="space-y-3 pt-3 border-t border-gray-800">
      <input type="hidden" name="proposal_id" value={proposalId} />
      <input type="hidden" name="vote" value={selectedVote} />
      <input type="hidden" name="voted_rarity" value={selectedRarity} />

      {/* Approve / Reject toggle */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setSelectedVote('approve')}
          className={`flex-1 text-xs py-2 rounded-lg border font-semibold transition-all ${
            selectedVote === 'approve' ? 'bg-green-800 border-green-500 text-green-200' : 'border-gray-700 text-gray-500 hover:text-green-400'
          }`}>
          ✓ Approve
        </button>
        <button type="button" onClick={() => setSelectedVote('reject')}
          className={`flex-1 text-xs py-2 rounded-lg border font-semibold transition-all ${
            selectedVote === 'reject' ? 'bg-red-900/60 border-red-500 text-red-200' : 'border-gray-700 text-gray-500 hover:text-red-400'
          }`}>
          ✗ Reject
        </button>
      </div>

      {/* Rarity picker */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">What rarity do you think this deserves?</p>
        <div className="flex gap-1.5">
          {RARITIES.map(r => (
            <button key={r} type="button" onClick={() => setSelectedRarity(r)}
              className={`flex-1 text-xs py-1.5 rounded-lg border capitalize transition-all ${selectedRarity === r ? rarityBtnSelected[r] : rarityBtn[r]}`}>
              {r.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1">{selectedRarity}</p>
      </div>

      {state.error && <p className="text-red-400 text-xs">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending}
          className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors">
          {pending ? '...' : userVote ? 'Update Vote' : 'Submit Vote'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
          cancel
        </button>
      </div>
    </form>
  )
}

// ── Main card ─────────────────────────────────────────────────
export default function ProposalCard({
  proposal,
  currentUserId,
}: {
  proposal: Proposal
  currentUserId: string
}) {
  const [showVoteForm, setShowVoteForm] = useState(false)

  const votes = proposal.proposal_votes ?? []
  const approves = votes.filter(v => v.vote === 'approve').length
  const rejects = votes.filter(v => v.vote === 'reject').length
  const total = approves + rejects
  const approvePercent = total > 0 ? Math.round((approves / total) * 100) : 50

  const userVote = votes.find(v => v.user_id === currentUserId) ?? null

  const rarityVoteCounts = votes.reduce((acc, v) => {
    acc[v.voted_rarity] = (acc[v.voted_rarity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const characterName = proposal.character?.name ?? proposal.new_character_name ?? 'Unknown'

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Card image */}
        <div className={`relative shrink-0 w-24 h-32 rounded-xl overflow-hidden border-2 ${
          proposal.proposed_rarity === 'legendary' ? 'rarity-legendary' :
          proposal.proposed_rarity === 'epic' ? 'rarity-epic' :
          proposal.proposed_rarity === 'rare' ? 'rarity-rare' : 'rarity-common'
        }`}>
          <Image src={proposal.image_url} alt={proposal.variant_name} fill className="object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="font-black text-white text-sm">{characterName}</span>
              <span className="text-gray-500 text-xs mx-1">·</span>
              <span className="text-gray-300 text-sm">{proposal.variant_name}</span>
            </div>
            {/* Status badge */}
            {proposal.status === 'voting' && (
              <span className="shrink-0 text-xs bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded-full">voting</span>
            )}
            {proposal.status === 'approved' && (
              <span className="shrink-0 text-xs bg-green-900/40 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full">✓ added</span>
            )}
            {proposal.status === 'rejected' && (
              <span className="shrink-0 text-xs bg-red-900/40 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full">rejected</span>
            )}
          </div>

          <p className="text-gray-500 text-xs mb-2">
            by {proposal.proposer?.display_name ?? proposal.proposer?.username ?? 'unknown'} ·{' '}
            suggested: <span className={`px-1.5 py-0.5 rounded-full border text-xs ${rarityBadge[proposal.proposed_rarity]}`}>{proposal.proposed_rarity}</span>
          </p>

          {/* Rarity votes breakdown */}
          {total > 0 && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {RARITIES.map(r => rarityVoteCounts[r] ? (
                <span key={r} className={`text-xs px-2 py-0.5 rounded-full border ${rarityBadge[r]}`}>
                  {r.charAt(0).toUpperCase()}: {rarityVoteCounts[r]}
                </span>
              ) : null)}
            </div>
          )}

          {/* Vote tally bar */}
          {proposal.status === 'voting' && total > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="text-green-400">{approves} approve</span>
                <span className="text-red-400">{rejects} reject</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${approvePercent}%` }} />
              </div>
            </div>
          )}

          {/* Admin note on rejected */}
          {proposal.status === 'rejected' && proposal.admin_note && (
            <p className="text-red-400/70 text-xs italic">Note: {proposal.admin_note}</p>
          )}

          {/* Vote CTA */}
          {proposal.status === 'voting' && !showVoteForm && (
            <div className="flex items-center gap-2 mt-2">
              {userVote ? (
                <>
                  <span className={`text-xs px-2 py-1 rounded-lg border ${userVote.vote === 'approve' ? 'bg-green-900/30 border-green-600 text-green-300' : 'bg-red-900/30 border-red-600 text-red-300'}`}>
                    your vote: {userVote.vote} ({userVote.voted_rarity})
                  </span>
                  <button onClick={() => setShowVoteForm(true)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">change</button>
                </>
              ) : (
                <button onClick={() => setShowVoteForm(true)}
                  className="text-xs bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                  Vote
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vote form expansion */}
      {showVoteForm && proposal.status === 'voting' && (
        <div className="px-4 pb-4">
          <VoteForm
            proposalId={proposal.id}
            userVote={userVote}
            onCancel={() => setShowVoteForm(false)}
          />
        </div>
      )}
    </div>
  )
}
