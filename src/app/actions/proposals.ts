'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type ProposalState = { error: string | null; success: string | null }

async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

async function requireAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
  if (!data?.is_admin) throw new Error('Not admin')
}

// ── Submit proposal ───────────────────────────────────────────
export async function submitProposalAction(
  prevState: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  let user
  try { user = await getCurrentUser() } catch { return { error: 'Not authenticated', success: null } }

  const characterId = formData.get('character_id') as string | null
  const newCharacterName = (formData.get('new_character_name') as string)?.trim() || null
  const variantName = (formData.get('variant_name') as string)?.trim()
  const proposedRarity = formData.get('proposed_rarity') as string
  const imageFile = formData.get('image') as File

  if (!variantName) return { error: 'Variant name required', success: null }
  if (!proposedRarity) return { error: 'Rarity required', success: null }
  if (!characterId && !newCharacterName) return { error: 'Pick a character or enter a new name', success: null }
  if (!imageFile || imageFile.size === 0) return { error: 'Image required', success: null }

  const fileExt = imageFile.name.split('.').pop() ?? 'jpg'
  const fileName = `proposals/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('card-images')
    .upload(fileName, imageFile, { contentType: imageFile.type })

  if (uploadError) return { error: `Upload failed: ${uploadError.message}`, success: null }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('card-images')
    .getPublicUrl(uploadData.path)

  const { error } = await supabaseAdmin.from('card_proposals').insert({
    proposed_by: user.id,
    character_id: characterId || null,
    new_character_name: newCharacterName,
    variant_name: variantName,
    proposed_rarity: proposedRarity,
    image_url: publicUrl,
    status: 'voting',
  })

  if (error) return { error: error.message, success: null }

  revalidatePath('/proposals')
  return { error: null, success: 'Proposal submitted!' }
}

// ── Vote on proposal ──────────────────────────────────────────
export async function voteAction(
  prevState: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  let user
  try { user = await getCurrentUser() } catch { return { error: 'Not authenticated', success: null } }

  const proposalId = formData.get('proposal_id') as string
  const vote = formData.get('vote') as string
  const votedRarity = formData.get('voted_rarity') as string

  if (!proposalId || !vote || !votedRarity) return { error: 'Incomplete vote', success: null }

  const { error } = await supabaseAdmin.from('proposal_votes').upsert(
    { proposal_id: proposalId, user_id: user.id, vote, voted_rarity: votedRarity },
    { onConflict: 'proposal_id,user_id' }
  )

  if (error) return { error: error.message, success: null }

  // Auto-approve if approve vote count reaches threshold
  if (vote === 'approve') {
    const { data: config } = await supabaseAdmin
      .from('gacha_config')
      .select('auto_approve_votes')
      .single()

    const threshold = config?.auto_approve_votes ?? 4

    const { count: approveCount } = await supabaseAdmin
      .from('proposal_votes')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposalId)
      .eq('vote', 'approve')

    if ((approveCount ?? 0) >= threshold) {
      // Check proposal is still in voting (not already decided)
      const { data: proposal } = await supabaseAdmin
        .from('card_proposals')
        .select('status')
        .eq('id', proposalId)
        .single()

      if (proposal?.status === 'voting') {
        await doApproveProposal(proposalId)
        revalidatePath('/proposals')
        revalidatePath('/admin/proposals')
        return { error: null, success: `Auto-approved! Reached ${threshold} yay votes.` }
      }
    }
  }

  revalidatePath('/proposals')
  revalidatePath('/admin/proposals')
  return { error: null, success: 'Vote saved!' }
}

// ── Internal: do the actual approval (shared by manual + auto) ─
async function doApproveProposal(proposalId: string, rarityOverride?: string): Promise<ProposalState> {
  const { data: proposal } = await supabaseAdmin
    .from('card_proposals')
    .select('*, proposal_votes(vote, voted_rarity)')
    .eq('id', proposalId)
    .single()

  if (!proposal) return { error: 'Proposal not found', success: null }
  if (proposal.status !== 'voting') return { error: null, success: 'Already decided' }

  // Determine rarity
  let rarity = rarityOverride ?? ''
  if (!rarity) {
    type VoteRow = { vote: string; voted_rarity: string }
    const approveVotes = ((proposal.proposal_votes ?? []) as VoteRow[]).filter(v => v.vote === 'approve')
    if (approveVotes.length > 0) {
      const counts: Record<string, number> = {}
      for (const v of approveVotes) counts[v.voted_rarity] = (counts[v.voted_rarity] || 0) + 1
      rarity = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    } else {
      rarity = proposal.proposed_rarity
    }
  }

  // Create character if new
  let characterId = proposal.character_id
  if (!characterId && proposal.new_character_name) {
    const { data: newChar, error: charError } = await supabaseAdmin
      .from('characters')
      .insert({ name: proposal.new_character_name })
      .select('id')
      .single()
    if (charError) return { error: `Failed to create character: ${charError.message}`, success: null }
    characterId = newChar.id
  }

  if (!characterId) return { error: 'No character to attach card to', success: null }

  const { error: cardError } = await supabaseAdmin.from('cards').insert({
    character_id: characterId,
    variant_name: proposal.variant_name,
    rarity,
    image_url: proposal.image_url,
  })
  if (cardError) return { error: cardError.message, success: null }

  await supabaseAdmin.from('card_proposals').update({ status: 'approved' }).eq('id', proposalId)

  revalidatePath('/proposals')
  revalidatePath('/admin/proposals')
  revalidatePath('/admin')
  return { error: null, success: 'Approved and card created!' }
}

// ── Admin: approve ────────────────────────────────────────────
export async function approveProposalAction(
  prevState: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  try {
    const user = await getCurrentUser()
    await requireAdmin(user.id)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Unauthorized', success: null }
  }

  const proposalId = formData.get('proposal_id') as string
  const rarityOverride = (formData.get('rarity') as string) || undefined
  return doApproveProposal(proposalId, rarityOverride)
}

// ── Admin: reject ─────────────────────────────────────────────
export async function rejectProposalAction(
  prevState: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  let user
  try {
    user = await getCurrentUser()
    await requireAdmin(user.id)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Unauthorized', success: null }
  }

  const proposalId = formData.get('proposal_id') as string
  const adminNote = (formData.get('admin_note') as string)?.trim() || null

  const { error } = await supabaseAdmin
    .from('card_proposals')
    .update({ status: 'rejected', admin_note: adminNote })
    .eq('id', proposalId)

  if (error) return { error: error.message, success: null }

  revalidatePath('/proposals')
  revalidatePath('/admin/proposals')
  return { error: null, success: 'Rejected' }
}
