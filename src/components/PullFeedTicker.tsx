'use client'

import { useEffect, useState } from 'react'
import { formatTimeAgo } from '@/lib/card-utils'

type Pull = {
  id: string
  obtained_at: string
  username: string
  variant_name: string
  rarity: 'rare' | 'epic' | 'legendary'
  character_name: string
}

const rarityEmoji: Record<string, string> = {
  rare: '🔵',
  epic: '🟣',
  legendary: '🟡',
}

const rarityColor: Record<string, string> = {
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

export default function PullFeedTicker() {
  const [pulls, setPulls] = useState<Pull[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPulls = async () => {
    try {
      const res = await fetch('/api/pull-feed')
      if (res.ok) {
        const data = await res.json()
        setPulls(data)
      }
    } catch (err) {
      console.error('Failed to fetch pull feed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPulls()
    const interval = setInterval(fetchPulls, 45000) // Refresh every 45 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-transparent border-b border-gray-800 py-3 px-4">
        <p className="text-gray-600 text-xs">Loading pull feed...</p>
      </div>
    )
  }

  if (pulls.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-transparent border-b border-gray-800 py-3 px-4">
        <p className="text-gray-600 text-xs">No pulls yet today...</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent border-b border-gray-800/50 overflow-hidden">
      <div className="animate-scroll whitespace-nowrap inline-flex gap-8 py-3 px-4">
        {pulls.map(pull => (
          <div key={pull.id} className="flex items-center gap-2 shrink-0">
            <span className="text-sm">🎴</span>
            <span className="text-gray-300 text-xs font-medium">{pull.username}</span>
            <span className="text-gray-600 text-xs">pulled</span>
            {pull.rarity && (
              <span className={`text-xs font-bold ${rarityColor[pull.rarity] || rarityColor['rare']}`}>
                {rarityEmoji[pull.rarity as any] || '🎴'} {pull.rarity.charAt(0).toUpperCase() + pull.rarity.slice(1)}
              </span>
            )}
            <span className="text-gray-400 text-xs">{pull.variant_name} {pull.character_name}</span>
            <span className="text-gray-600 text-xs">— {formatTimeAgo(pull.obtained_at)}</span>
          </div>
        ))}
        {/* Duplicate for seamless scroll */}
        {pulls.map(pull => (
          <div key={`${pull.id}-dup`} className="flex items-center gap-2 shrink-0">
            <span className="text-sm">🎴</span>
            <span className="text-gray-300 text-xs font-medium">{pull.username}</span>
            <span className="text-gray-600 text-xs">pulled</span>
            {pull.rarity && (
              <span className={`text-xs font-bold ${rarityColor[pull.rarity] || rarityColor['rare']}`}>
                {rarityEmoji[pull.rarity as any] || '🎴'} {pull.rarity.charAt(0).toUpperCase() + pull.rarity.slice(1)}
              </span>
            )}
            <span className="text-gray-400 text-xs">{pull.variant_name} {pull.character_name}</span>
            <span className="text-gray-600 text-xs">— {formatTimeAgo(pull.obtained_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
