'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type PullResult = {
  error: string | null
  card: {
    id: string
    variant_name: string
    rarity: string
    image_url: string
    character: { name: string }
  } | null
  isDuplicate: boolean
  isPityPull: boolean
  newTokenCount: number
  newPityCounter: number
  pityThreshold: number
  pullCost: number
}

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

function pickRarity(
  weights: { common: number; rare: number; epic: number; legendary: number },
  isPityPull: boolean
): Rarity {
  if (isPityPull) {
    return Math.random() < 0.8 ? 'epic' : 'legendary'
  }
  const total = weights.common + weights.rare + weights.epic + weights.legendary
  const roll = Math.random() * total
  let c = 0
  c += weights.common;    if (roll < c) return 'common'
  c += weights.rare;      if (roll < c) return 'rare'
  c += weights.epic;      if (roll < c) return 'epic'
  return 'legendary'
}

const ERR = (msg: string, tokens = 0, pity = 0, threshold = 50, cost = 1): PullResult => ({
  error: msg, card: null, isDuplicate: false, isPityPull: false,
  newTokenCount: tokens, newPityCounter: pity, pityThreshold: threshold, pullCost: cost,
})

export async function pullCardAction(): Promise<PullResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ERR('Not authenticated')

  const [profileRes, configRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('tokens, pity_counter').eq('id', user.id).single(),
    supabaseAdmin.from('gacha_config').select('*').single(),
  ])

  const profile = profileRes.data
  const config = configRes.data

  if (!profile) return ERR('Profile not found')
  if (!config) return ERR('Config not found')

  const { tokens, pity_counter } = profile
  const { pull_cost, pity_threshold } = config

  if (tokens < pull_cost) {
    return ERR(`Not enough tokens (need ${pull_cost}, have ${tokens})`, tokens, pity_counter, pity_threshold, pull_cost)
  }

  const isPityPull = pity_counter >= pity_threshold

  const rarity = pickRarity({
    common: config.common_weight,
    rare: config.rare_weight,
    epic: config.epic_weight,
    legendary: config.legendary_weight,
  }, isPityPull)

  // Fetch cards of the rolled rarity, fall back to any rarity if empty
  let { data: cards } = await supabaseAdmin
    .from('cards')
    .select('*, character:characters(name)')
    .eq('rarity', rarity)

  if (!cards || cards.length === 0) {
    const { data: allCards } = await supabaseAdmin
      .from('cards')
      .select('*, character:characters(name)')
    cards = allCards
  }

  if (!cards || cards.length === 0) {
    return ERR('No cards exist yet — admin needs to add some!', tokens, pity_counter, pity_threshold, pull_cost)
  }

  const card = cards[Math.floor(Math.random() * cards.length)]

  // Check dupe
  const { data: existing } = await supabaseAdmin
    .from('user_cards')
    .select('id')
    .eq('user_id', user.id)
    .eq('card_id', card.id)
    .maybeSingle()

  const isDuplicate = !!existing

  // Insert user_card
  await supabaseAdmin.from('user_cards').insert({ user_id: user.id, card_id: card.id })

  // Update profile
  const isEpicPlus = card.rarity === 'epic' || card.rarity === 'legendary'
  const newPityCounter = isEpicPlus ? 0 : pity_counter + 1
  const newTokenCount = tokens - pull_cost

  await supabaseAdmin.from('profiles').update({
    tokens: newTokenCount,
    pity_counter: newPityCounter,
  }).eq('id', user.id)

  return {
    error: null,
    card: {
      id: card.id,
      variant_name: card.variant_name,
      rarity: card.rarity,
      image_url: card.image_url,
      character: card.character,
    },
    isDuplicate,
    isPityPull,
    newTokenCount,
    newPityCounter,
    pityThreshold: pity_threshold,
    pullCost: pull_cost,
  }
}
