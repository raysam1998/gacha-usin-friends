import Link from 'next/link'
import Navbar from '@/components/Navbar'
import PullFeedTicker from '@/components/PullFeedTicker'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('username, display_name, is_admin, tokens')
    .eq('id', user.id)
    .single()

  const { count: cardCount } = await supabaseAdmin
    .from('user_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const name = profile?.display_name ?? profile?.username ?? 'homie'

  const actions = [
    {
      href: '/pull',
      icon: '🎴',
      label: 'Pull',
      desc: 'Spend tokens, pull cards',
      color: 'from-violet-600/20 to-purple-600/20',
      border: 'border-violet-500/20',
      hover: 'hover:border-violet-500/50 hover:from-violet-600/30 hover:to-purple-600/30',
    },
    {
      href: '/collection',
      icon: '📚',
      label: 'Collection',
      desc: 'Browse your cards',
      color: 'from-blue-600/20 to-cyan-600/20',
      border: 'border-blue-500/20',
      hover: 'hover:border-blue-500/50 hover:from-blue-600/30 hover:to-cyan-600/30',
    },
    {
      href: '/trade',
      icon: '🤝',
      label: 'Trade',
      desc: 'Swap cards with friends',
      color: 'from-emerald-600/20 to-teal-600/20',
      border: 'border-emerald-500/20',
      hover: 'hover:border-emerald-500/50 hover:from-emerald-600/30 hover:to-teal-600/30',
    },
    {
      href: '/proposals',
      icon: '💡',
      label: 'Proposals',
      desc: 'Submit & vote on new cards',
      color: 'from-amber-600/20 to-orange-600/20',
      border: 'border-amber-500/20',
      hover: 'hover:border-amber-500/50 hover:from-amber-600/30 hover:to-orange-600/30',
    },
  ]

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#08080f]">
        <PullFeedTicker />
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-4xl font-black tracking-tight mb-2">
              welcome back,{' '}
              <span className="text-gradient">{name}</span>
            </h1>
            <p className="text-gray-500 text-sm">
              you have{' '}
              <span className="text-amber-400 font-bold">{profile?.tokens ?? 0} tokens</span>
              {' '}and{' '}
              <span className="text-violet-400 font-bold">{cardCount ?? 0} cards</span>
            </p>
          </div>

          {/* Action grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group relative bg-gradient-to-br ${action.color} ${action.hover} border ${action.border} rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                  {action.icon}
                </span>
                <div className="text-center">
                  <div className="font-bold text-white text-sm">{action.label}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Admin quick access */}
          {profile?.is_admin && (
            <div className="mt-8 glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <div className="text-white font-bold text-sm">Admin Panel</div>
                  <div className="text-gray-400 text-xs">Manage characters, cards, and users</div>
                </div>
              </div>
              <Link
                href="/admin"
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Open
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
