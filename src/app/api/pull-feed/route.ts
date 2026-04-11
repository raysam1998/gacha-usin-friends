import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    // Query with proper nested selection
    const { data: userCards, error } = await supabaseAdmin
      .from('user_cards')
      .select(`
        id,
        obtained_at,
        user_id,
        card_id,
        card:card_id(
          id,
          variant_name,
          rarity,
          created_at,
          character_id,
          character:character_id(id, name)
        )
      `)
      .in('card.rarity', ['rare', 'epic', 'legendary'])
      .order('obtained_at', { ascending: false })
      .limit(30)

    if (error) throw error

    // Get usernames for each pull
    const userIds = [...new Set(userCards?.map(uc => uc.user_id) || [])]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, username')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    const pulls = userCards?.map((uc: any) => {
      const profile = profileMap.get(uc.user_id)
      const card = uc.card
      return {
        id: uc.id,
        obtained_at: uc.obtained_at,
        username: profile?.display_name || profile?.username || 'Unknown',
        variant_name: card?.variant_name || 'Unknown',
        rarity: card?.rarity || 'common',
        character_name: card?.character?.name || 'Unknown',
      }
    }) || []

    return Response.json(pulls)
  } catch (err) {
    console.error('Pull feed error:', err)
    return Response.json([], { status: 500 })
  }
}

