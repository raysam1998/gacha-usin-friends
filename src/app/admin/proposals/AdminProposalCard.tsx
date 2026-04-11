'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { approveProposalAction, rejectProposalAction } from '@/app/actions/proposals'

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

const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const
const rarityColors: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

function getMostVotedRarity(votes: Vote[]): string {
  const approveVotes = votes.filter(v => v.vote === 'approve')
  if (!approveVotes.length) return 'common'
  const counts = approveVotes.reduce((acc, v) => {
    acc[v.voted_rarity] = (acc[v.voted_rarity] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'common'
}

export default function AdminProposalCard({ proposal }: { proposal: Proposal }) {
  const [approveState, approveAction, approvePending] = useActionState(approveProposalAction, { error: null, success: null })
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectProposalAction, { error: null, success: null })
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')
  const [rarityOverride, setRarityOverride] = useState(getMostVotedRarity(proposal.proposal_votes))

  const votes = proposal.proposal_votes ?? []
  const approves = votes.filter(v => v.vote === 'approve').length
  const rejects = votes.filter(v => v.vote === 'reject').length

  const rarityVoteCounts = votes.reduce((acc, v) => {
    acc[v.voted_rarity] = (acc[v.voted_rarity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const characterName = proposal.character?.name ?? proposal.new_character_name ?? 'Unknown'
  const isNewChar = !proposal.character && !!proposal.new_character_name

  if (approveState.success || rejectState.success) {
    return (
      <div className="glass rounded-xl p-4 border-green-500/20 flex items-center gap-3 text-green-400 text-sm">
        <span>✓ {approveState.success ?? rejectState.success}</span>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative shrink-0 w-20 h-28 rounded-lg overflow-hidden border border-gray-700">
          <Image src={proposal.image_url} alt={proposal.variant_name} fill className="object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <div>
              <span className="font-bold text-white text-sm">{characterName}</span>
              {isNewChar && <span className="ml-1 text-xs text-amber-400 bg-amber-900/30 border border-amber-500/30 px-1.5 rounded-full">new homie</span>}
              <span className="text-gray-400 text-sm ml-1">· {proposal.variant_name}</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-2">
            by {proposal.proposer?.display_name ?? proposal.proposer?.username} ·{' '}
            suggested: <span className={`font-semibold ${rarityColors[proposal.proposed_rarity]}`}>{proposal.proposed_rarity}</span>
          </p>

          {/* Vote counts */}
          <div className="flex gap-3 text-xs mb-2">
            <span className="text-green-400 font-bold">{approves} approve</span>
            <span className="text-red-400 font-bold">{rejects} reject</span>
            {Object.entries(rarityVoteCounts).map(([r, count]) => (
              <span key={r} className={rarityColors[r]}>{r.charAt(0).toUpperCase()}: {count}</span>
            ))}
          </div>

          {/* Decide buttons */}
          {proposal.status === 'voting' && mode === 'idle' && (
            <div className="flex gap-2">
              <button onClick={() => setMode('approve')}
                className="text-xs bg-green-900/30 border border-green-600/50 text-green-300 hover:bg-green-900/50 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                ✓ Approve
              </button>
              <button onClick={() => setMode('reject')}
                className="text-xs bg-red-900/30 border border-red-600/50 text-red-300 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                ✗ Reject
              </button>
            </div>
          )}

          {proposal.status !== 'voting' && (
            <span className={`text-xs px-2 py-1 rounded-full border ${
              proposal.status === 'approved'
                ? 'bg-green-900/30 border-green-500/40 text-green-300'
                : 'bg-red-900/30 border-red-500/40 text-red-300'
            }`}>
              {proposal.status === 'approved' ? '✓ Approved' : `Rejected${proposal.admin_note ? `: ${proposal.admin_note}` : ''}`}
            </span>
          )}
        </div>
      </div>

      {/* Approve form */}
      {mode === 'approve' && (
        <form action={approveAction} className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-800/50">
          <input type="hidden" name="proposal_id" value={proposal.id} />
          <input type="hidden" name="rarity" value={rarityOverride} />
          <div className="pt-3">
            <p className="text-xs text-gray-400 mb-2">Card rarity (defaults to most-voted):</p>
            <div className="flex gap-2">
              {RARITIES.map(r => (
                <button key={r} type="button" onClick={() => setRarityOverride(r)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border capitalize transition-all ${
                    rarityOverride === r
                      ? r === 'legendary' ? 'bg-amber-800 border-amber-400 text-white'
                        : r === 'epic' ? 'bg-purple-800 border-purple-400 text-white'
                        : r === 'rare' ? 'bg-blue-800 border-blue-400 text-white'
                        : 'bg-gray-700 border-gray-400 text-white'
                      : 'border-gray-700 text-gray-500'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          {approveState.error && <p className="text-red-400 text-xs">{approveState.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={approvePending}
              className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              {approvePending ? 'Approving...' : 'Confirm Approve'}
            </button>
            <button type="button" onClick={() => setMode('idle')} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2">cancel</button>
          </div>
        </form>
      )}

      {/* Reject form */}
      {mode === 'reject' && (
        <form action={rejectAction} className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-800/50">
          <input type="hidden" name="proposal_id" value={proposal.id} />
          <input name="admin_note" placeholder="Reason (optional)" className="mt-3 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 outline-none focus:border-red-500" />
          {rejectState.error && <p className="text-red-400 text-xs">{rejectState.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={rejectPending}
              className="bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              {rejectPending ? 'Rejecting...' : 'Confirm Reject'}
            </button>
            <button type="button" onClick={() => setMode('idle')} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2">cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
