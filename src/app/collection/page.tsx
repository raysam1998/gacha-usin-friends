import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CollectionGrid from './CollectionGrid'

export default async function CollectionPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, cardsRes, allProfilesRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('username, display_name').eq('id', user.id).single(),
    supabaseAdmin
      .from('user_cards')
      .select('id, card_id, obtained_at, card:cards(id, variant_name, rarity, image_url, character:characters(id, name))')
      .eq('user_id', user.id)
      .order('obtained_at', { ascending: false }),
    supabaseAdmin.from('profiles').select('username, display_name').neq('id', user.id).order('username'),
  ])

  const profile = profileRes.data
  const cards = (cardsRes.data ?? []) as unknown as Parameters<typeof CollectionGrid>[0]['cards']
  const others = allProfilesRes.data ?? []
  const name = profile?.display_name ?? profile?.username ?? 'you'

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">{name}&apos;s Collection</h1>
              <p className="text-gray-500 text-sm mt-1">your cards, your glory</p>
            </div>
            {others.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">compare with:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {others.map(u => (
                    <Link key={u.username} href={`/collection/${u.username}`}
                      className="text-xs bg-gray-900 border border-gray-700 hover:border-violet-500/50 text-gray-300 hover:text-violet-300 px-2.5 py-1 rounded-full transition-colors">
                      {u.display_name ?? u.username}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🃏</div>
              <p className="text-gray-500 text-sm">No cards yet.</p>
              <Link href="/pull" className="mt-4 inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
                Pull some cards
              </Link>
            </div>
          ) : (
            <CollectionGrid cards={cards} ownerName={name} />
          )}
        </div>
      </main>
    </>
  )
}
