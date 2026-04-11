'use client'

import { isNewCard } from '@/lib/card-utils'

export function NewBadge({ createdAt, className = '' }: { createdAt: string; className?: string }) {
  if (!isNewCard(createdAt)) return null

  return (
    <div className={`absolute top-1 left-1 bg-pink-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full animate-pulse ${className}`}>
      NEW
    </div>
  )
}
