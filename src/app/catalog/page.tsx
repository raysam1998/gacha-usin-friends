import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CatalogGrid from './CatalogGrid'

export default async function CatalogPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all cards with character info
  const { data: cardsRes } = await supabaseAdmin
    .from('cards')
    .select(`
      id,
      character_id,
      variant_name,
      rarity,
      image_url,
      created_at,
      character:characters(id, name)
    `)
    .order('character_id, rarity')

  // Fetch user's cards
  const { data: userCardsRes } = await supabaseAdmin
    .from('user_cards')
    .select('card_id')
    .eq('user_id', user.id)

  const userCardIds = new Set(userCardsRes?.map(uc => uc.card_id) || [])

  // Fetch total player count
  const { count: totalPlayers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get stats for each card
  const cardIds = cardsRes?.map(c => c.id) || []
  const { data: cardStats } = await supabaseAdmin
    .from('user_cards')
    .select('card_id')

  const cardStatMap = new Map<string, number>()
  cardStats?.forEach(cs => {
    cardStatMap.set(cs.card_id, (cardStatMap.get(cs.card_id) || 0) + 1)
  })

  const cardOwnersMap = new Map<string, Set<string>>()
  const { data: userCardsFull } = await supabaseAdmin
    .from('user_cards')
    .select('card_id, user_id')

  userCardsFull?.forEach(uc => {
    if (!cardOwnersMap.has(uc.card_id)) {
      cardOwnersMap.set(uc.card_id, new Set())
    }
    cardOwnersMap.get(uc.card_id)!.add(uc.user_id)
  })

  // Structure for CatalogGrid
  const characters = new Map<string, {
    id: string
    name: string
    cards: any[]
  }>()

  cardsRes?.forEach(card => {
    const charId = (card as any).character_id
    const charName = (card as any).character?.name || 'Unknown'
    const charKey = `${charId}:${charName}`

    if (!characters.has(charKey)) {
      characters.set(charKey, {
        id: charId,
        name: charName,
        cards: [],
      })
    }

    characters.get(charKey)!.cards.push({
      id: card.id,
      character_id: charId,
      character_name: charName,
      variant_name: card.variant_name,
      rarity: card.rarity,
      image_url: card.image_url,
      created_at: card.created_at,
      owned: userCardIds.has(card.id),
      total_copies: cardStatMap.get(card.id) || 0,
      unique_owners: cardOwnersMap.get(card.id)?.size || 0,
      total_players: totalPlayers || 0,
    })
  })

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📚</span>
              <h1 className="text-3xl font-black text-white">Gachapedia</h1>
            </div>
            <p className="text-gray-500 text-sm">
              Complete card catalog. {cardsRes?.length || 0} cards from {characters.size} characters.
            </p>
          </div>

          <CatalogGrid characters={Array.from(characters.values())} />

          <div className="mt-12 text-center">
            <Link href="/collection" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              ← Back to your collection
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
