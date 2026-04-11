export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type ProposalStatus = 'voting' | 'approved' | 'rejected'
export type VoteType = 'approve' | 'reject'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  is_admin: boolean
  tokens: number
  last_token_refresh: string
  pity_counter: number
  created_at: string
}

export interface Character {
  id: string
  name: string
  bio: string | null
  created_at: string
}

export interface Card {
  id: string
  character_id: string
  variant_name: string
  rarity: Rarity
  image_url: string
  created_at: string
  character?: Character
}

export interface UserCard {
  id: string
  user_id: string
  card_id: string
  obtained_at: string
  is_tradeable: boolean
  card?: Card
}

export interface Trade {
  id: string
  from_user_id: string
  to_user_id: string
  status: TradeStatus
  created_at: string
  updated_at: string
}

export interface TradeItem {
  id: string
  trade_id: string
  user_card_id: string
  offered_by: string
}

export interface CardProposal {
  id: string
  proposed_by: string
  character_id: string | null
  new_character_name: string | null
  variant_name: string
  image_url: string
  proposed_rarity: Rarity
  status: ProposalStatus
  admin_note: string | null
  created_at: string
  proposer?: Profile
  character?: Character
}

export interface ProposalVote {
  id: string
  proposal_id: string
  user_id: string
  vote: VoteType
  voted_rarity: Rarity
  created_at: string
}

export interface GachaConfig {
  id: string
  daily_tokens: number
  pull_cost: number
  common_weight: number
  rare_weight: number
  epic_weight: number
  legendary_weight: number
  dupe_reroll_cost: number
  pity_threshold: number
}
