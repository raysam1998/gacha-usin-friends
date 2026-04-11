'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type CardData = {
  id: string
  variant_name: string
  rarity: string
  image_url: string
  character: { id: string; name: string }
}

export type UserCardEntry = {
  id: string
  card_id: string
  obtained_at: string
  card: CardData
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-600', rare: 'border-blue-400',
  epic: 'border-purple-400', legendary: 'border-amber-400',
}
const RARITY_GLOW: Record<string, React.CSSProperties> = {
  common:    {},
  rare:      { boxShadow: '0 0 12px rgba(96,165,250,0.5)' },
  epic:      { boxShadow: '0 0 16px rgba(192,132,252,0.6)' },
  legendary: { boxShadow: '0 0 24px rgba(251,191,36,0.7)' },
}
const RARITY_ORDER = ['legendary', 'epic', 'rare', 'common']

function CardTile({ uc, dupeCount, highlight }: {
  uc: UserCardEntry
  dupeCount: number
  highlight?: 'mine' | 'theirs' | null
}) {
  return (
    <div className={`relative group rounded-xl overflow-hidden border-2 flex flex-col transition-transform hover:-translate-y-1 hover:scale-[1.02] cursor-default ${RARITY_BORDER[uc.card.rarity] ?? 'border-gray-700'} ${
      highlight === 'mine'   ? 'ring-2 ring-green-500/60 ring-offset-1 ring-offset-gray-950' :
      highlight === 'theirs' ? 'ring-2 ring-amber-500/60 ring-offset-1 ring-offset-gray-950' : ''
    }`} style={RARITY_GLOW[uc.card.rarity]}>
      <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
        <Image src={uc.card.image_url} alt={uc.card.variant_name} fill className="object-cover" />
        {dupeCount > 1 && (
          <div className="absolute top-1.5 right-1.5 bg-gray-950/90 border border-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            ×{dupeCount}
          </div>
        )}
        {highlight === 'mine' && (
          <div className="absolute top-1.5 left-1.5 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">you</div>
        )}
        {highlight === 'theirs' && (
          <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">them</div>
        )}
      </div>
      <div className="bg-gray-950/90 px-2 py-1.5">
        <p className="text-white text-xs font-bold truncate">{uc.card.character.name}</p>
        <p className="text-gray-500 text-xs truncate">{uc.card.variant_name}</p>
      </div>
    </div>
  )
}

export default function CollectionGrid({
  cards,
  compareCards,
  ownerName,
  viewerName,
}: {
  cards: UserCardEntry[]
  compareCards?: UserCardEntry[] | null
  ownerName: string
  viewerName?: string | null
}) {
  const [charFilter, setCharFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [dupesOnly, setDupesOnly] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  // Compute dupe counts
  const dupeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const uc of cards) counts[uc.card_id] = (counts[uc.card_id] || 0) + 1
    return counts
  }, [cards])

  // Unique characters for filter
  const characters = useMemo(() => {
    const map = new Map<string, string>()
    for (const uc of cards) map.set(uc.card.character.id, uc.card.character.name)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [cards])

  // Compare sets
  const compareCardIds = useMemo(
    () => new Set((compareCards ?? []).map(uc => uc.card_id)),
    [compareCards]
  )
  const myCardIds = useMemo(() => new Set(cards.map(uc => uc.card_id)), [cards])

  // Filtered cards
  const filtered = useMemo(() => {
    let result = cards
    if (charFilter !== 'all') result = result.filter(uc => uc.card.character.id === charFilter)
    if (rarityFilter !== 'all') result = result.filter(uc => uc.card.rarity === rarityFilter)
    if (dupesOnly) result = result.filter(uc => dupeCounts[uc.card_id] > 1)
    // Sort: rarity desc, then name
    result = [...result].sort((a, b) => {
      const ri = RARITY_ORDER.indexOf(a.card.rarity) - RARITY_ORDER.indexOf(b.card.rarity)
      if (ri !== 0) return ri
      return a.card.character.name.localeCompare(b.card.character.name)
    })
    return result
  }, [cards, charFilter, rarityFilter, dupesOnly, dupeCounts])

  // Compare-mode cards
  const onlyMine = useMemo(
    () => cards.filter(uc => !compareCardIds.has(uc.card_id)),
    [cards, compareCardIds]
  )
  const onlyTheirs = useMemo(
    () => (compareCards ?? []).filter(uc => !myCardIds.has(uc.card_id)),
    [compareCards, myCardIds]
  )
  const bothHave = useMemo(
    () => cards.filter(uc => compareCardIds.has(uc.card_id)),
    [cards, compareCardIds]
  )

  const uniqueCount = new Set(cards.map(uc => uc.card_id)).size

  return (
    <div>
      {/* Stats row */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <span className="text-gray-300 text-sm">
          <span className="text-white font-bold">{cards.length}</span> cards
          <span className="text-gray-500 ml-1">({uniqueCount} unique)</span>
        </span>
        {compareCards && viewerName && (
          <button
            onClick={() => setCompareMode(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
              compareMode
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'border-violet-500/40 text-violet-400 hover:bg-violet-600/20'
            }`}
          >
            {compareMode ? '× exit compare' : '⇄ compare with ' + viewerName}
          </button>
        )}
      </div>

      {/* Compare mode */}
      {compareMode && compareCards && (
        <div className="mb-8 space-y-6">
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-green-400 font-bold">✓ {onlyMine.length} only you have</span>
            <span className="text-amber-400 font-bold">✗ {onlyTheirs.length} only they have</span>
            <span className="text-gray-500">{bothHave.length} both have</span>
          </div>

          {onlyMine.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Only you have</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {onlyMine.map(uc => (
                  <CardTile key={uc.id} uc={uc} dupeCount={dupeCounts[uc.card_id] ?? 1} highlight="mine" />
                ))}
              </div>
            </div>
          )}

          {onlyTheirs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">Only they have</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {onlyTheirs.map(uc => (
                  <CardTile key={uc.id} uc={uc} dupeCount={1} highlight="theirs" />
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Both have</h3>
          </div>
        </div>
      )}

      {/* Filters (shown in normal mode, or after compare section) */}
      {!compareMode && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <select
            value={charFilter}
            onChange={e => setCharFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-violet-500"
          >
            <option value="all">All characters</option>
            {characters.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          <div className="flex gap-1">
            {['all', 'legendary', 'epic', 'rare', 'common'].map(r => (
              <button key={r} onClick={() => setRarityFilter(r)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize transition-colors ${
                  rarityFilter === r
                    ? r === 'legendary' ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                      : r === 'epic' ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                      : r === 'rare' ? 'bg-blue-900/60 border-blue-500 text-blue-200'
                      : r === 'common' ? 'bg-gray-800 border-gray-500 text-gray-200'
                      : 'bg-violet-600 border-violet-500 text-white'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                }`}>
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setDupesOnly(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              dupesOnly ? 'bg-amber-900/40 border-amber-500/50 text-amber-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            dupes only
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm border border-dashed border-gray-800 rounded-xl">
          {dupesOnly ? 'No duplicates — clean collection!' : 'No cards match the filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map(uc => (
            <CardTile key={uc.id} uc={uc} dupeCount={dupeCounts[uc.card_id] ?? 1} />
          ))}
        </div>
      )}

      {/* View all users link */}
      <div className="mt-8 text-center">
        <Link href="/collection" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
          ← back to collections
        </Link>
      </div>
    </div>
  )
}
