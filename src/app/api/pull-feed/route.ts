import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_cards')
      .select(`
        id,
        obtained_at,
        user:profiles(id, display_name, username),
        card:cards(id, variant_name, rarity, created_at, character:characters(id, name))
      `)
      .in('card.rarity', ['rare', 'epic', 'legendary'])
      .order('obtained_at', { ascending: false })
      .limit(30)

    if (error) throw error

    const pulls = data?.map((uc: any) => ({
      id: uc.id,
      obtained_at: uc.obtained_at,
      username: uc.user?.display_name || uc.user?.username || 'Unknown',
      variant_name: uc.card?.variant_name,
      rarity: uc.card?.rarity,
      character_name: uc.card?.character?.name,
    })) || []

    return Response.json(pulls)
  } catch (err) {
    console.error('Pull feed error:', err)
    return Response.json([], { status: 500 })
  }
}
