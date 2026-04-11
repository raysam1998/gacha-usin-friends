import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CollectionGrid from '../CollectionGrid'

export default async function UserCollectionPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get target user
  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .single()

  if (!targetProfile) notFound()

  // Get viewer profile
  const { data: viewerProfile } = await supabaseAdmin
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single()

  const isOwnCollection = targetProfile.id === user.id
  if (isOwnCollection) redirect('/collection')

  const fetchCards = (userId: string) =>
    supabaseAdmin
      .from('user_cards')
      .select('id, card_id, obtained_at, card:cards(id, variant_name, rarity, image_url, character:characters(id, name))')
      .eq('user_id', userId)
      .order('obtained_at', { ascending: false })

  const [targetCardsRes, viewerCardsRes] = await Promise.all([
    fetchCards(targetProfile.id),
    fetchCards(user.id),
  ])

  const targetCards = (targetCardsRes.data ?? []) as unknown as Parameters<typeof CollectionGrid>[0]['cards']
  const viewerCards = (viewerCardsRes.data ?? []) as unknown as Parameters<typeof CollectionGrid>[0]['cards']

  const targetName = targetProfile.display_name ?? targetProfile.username
  const viewerName = viewerProfile?.display_name ?? viewerProfile?.username ?? 'you'

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">{targetName}&apos;s Collection</h1>
            <p className="text-gray-500 text-sm mt-1">
              {targetCards.length} cards · click &quot;compare&quot; to see the diff vs your collection
            </p>
          </div>

          {targetCards.length === 0 ? (
            <div className="text-center py-20 text-gray-600 text-sm">
              {targetName} hasn&apos;t pulled any cards yet.
            </div>
          ) : (
            <CollectionGrid
              cards={targetCards}
              compareCards={viewerCards}
              ownerName={targetName}
              viewerName={viewerName}
            />
          )}
        </div>
      </main>
    </>
  )
}
