'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { NewBadge } from '@/components/NewBadge'

type CardWithStats = {
  id: string
  character_id: string
  character_name: string
  variant_name: string
  rarity: string
  image_url: string
  created_at: string
  owned: boolean
  total_copies: number
  unique_owners: number
  total_players: number
}

type Character = {
  id: string
  name: string
  cards: CardWithStats[]
}

const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const
const rarityColors: Record<string, string> = {
  common: 'border-gray-600',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-amber-400',
}

export default function CatalogGrid({
  characters,
}: {
  characters: Character[]
}) {
  const [search, setSearch] = useState('')
  const [charFilter, setCharFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [ownedFilter, setOwnedFilter] = useState<'all' | 'owned' | 'missing'>('all')
  const [selectedCard, setSelectedCard] = useState<CardWithStats | null>(null)

  const allCards = useMemo(() => characters.flatMap(c => c.cards), [characters])
  const uniqueCharacters = useMemo(() => characters.map(c => ({ id: c.id, name: c.name })), [characters])

  const filtered = useMemo(() => {
    return allCards.filter(card => {
      if (search && !card.variant_name.toLowerCase().includes(search.toLowerCase()) &&
          !card.character_name.toLowerCase().includes(search.toLowerCase())) return false
      if (charFilter !== 'all' && card.character_id !== charFilter) return false
      if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false
      if (ownedFilter === 'owned' && !card.owned) return false
      if (ownedFilter === 'missing' && card.owned) return false
      return true
    })
  }, [allCards, search, charFilter, rarityFilter, ownedFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, CardWithStats[]>()
    filtered.forEach(card => {
      const key = card.character_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(card)
    })
    return Array.from(map.entries()).map(([charId, cards]) => ({
      charId,
      charName: cards[0].character_name,
      cards,
    }))
  }, [filtered])

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search cards or characters..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-violet-500 outline-none"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={charFilter}
            onChange={e => setCharFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-violet-500"
          >
            <option value="all">All characters</option>
            {uniqueCharacters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex gap-1">
            {['all', ...RARITIES].map(r => (
              <button
                key={r}
                onClick={() => setRarityFilter(r as any)}
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

          <div className="flex gap-1 ml-auto">
            {['all', 'owned', 'missing'].map(f => (
              <button
                key={f}
                onClick={() => setOwnedFilter(f as any)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize transition-colors ${
                  ownedFilter === f
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                }`}>
                {f === 'all' ? 'All' : f === 'owned' ? '✓ Owned' : '✗ Missing'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards grouped by character */}
      {grouped.length === 0 ? (
        <div className="text-center py-20 text-gray-600 text-sm">
          No cards match filters.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.charId}>
              <div className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">
                {group.charName}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {group.cards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`relative group rounded-xl overflow-hidden border-2 flex flex-col transition-all hover:scale-105 ${
                      rarityColors[card.rarity] ?? 'border-gray-700'
                    } ${!card.owned ? 'opacity-50 hover:opacity-75' : ''}`}>
                    <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                      <Image
                        src={card.image_url}
                        alt={card.variant_name}
                        fill
                        className={`object-cover ${!card.owned ? 'blur-sm' : ''}`}
                      />
                      {card.owned && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          ✓
                        </div>
                      )}
                      <NewBadge createdAt={card.created_at} />
                      {card.total_copies > 1 && card.owned && (
                        <div className="absolute bottom-1 right-1 bg-gray-950/90 border border-white/20 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                          ×{card.total_copies}
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-950/90 px-2 py-1.5">
                      <p className="text-white text-xs font-bold truncate">{card.character_name}</p>
                      <p className="text-gray-500 text-xs truncate">{card.variant_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}>
          <div
            className="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              {/* Image */}
              <div className="relative w-full rounded-xl overflow-hidden border-2" style={{ aspectRatio: '3/4' }}>
                <Image
                  src={selectedCard.image_url}
                  alt={selectedCard.variant_name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Title */}
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest">
                  {selectedCard.character_name}
                </p>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {selectedCard.variant_name}
                </h2>
                <div className={`inline-block text-xs font-bold px-2 py-1 rounded-full mt-2 ${
                  selectedCard.rarity === 'legendary' ? 'bg-amber-900/60 text-amber-200 border border-amber-500/30'
                    : selectedCard.rarity === 'epic' ? 'bg-purple-900/60 text-purple-200 border border-purple-500/30'
                    : selectedCard.rarity === 'rare' ? 'bg-blue-900/60 text-blue-200 border border-blue-500/30'
                    : 'bg-gray-800 text-gray-200 border border-gray-500/30'
                }`}>
                  {selectedCard.rarity.charAt(0).toUpperCase() + selectedCard.rarity.slice(1)}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3 border-t border-gray-800 pt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Owned by</p>
                    <p className="text-white font-bold">{selectedCard.unique_owners}/{selectedCard.total_players}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Total pulled</p>
                    <p className="text-white font-bold">{selectedCard.total_copies}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <p className="text-gray-500 text-xs mb-1">Ownership</p>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${(selectedCard.unique_owners / selectedCard.total_players) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Drop rate */}
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-gray-500 text-xs">Gacha drop rate</p>
                  <p className="text-white font-bold text-sm">
                    {selectedCard.rarity === 'common' ? '60%'
                      : selectedCard.rarity === 'rare' ? '25%'
                      : selectedCard.rarity === 'epic' ? '10%'
                      : '5%'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCard(null)}
                className="w-full mt-4 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
