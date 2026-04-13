'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function useDailyCountdown() {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const calc = () => {
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      setSecs(Math.ceil((midnight.getTime() - Date.now()) / 1000))
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])
  return secs
}

export default function TokenTimer({
  lastBonusAt,
  intervalHours,
  bonusAmount,
  dailyTokens,
}: {
  lastBonusAt: string | null
  intervalHours: number
  bonusAmount: number
  dailyTokens: number
}) {
  const router = useRouter()
  const [bonusSecs, setBonusSecs] = useState<number | null>(null)
  const dailySecs = useDailyCountdown()

  useEffect(() => {
    if (!bonusAmount || intervalHours <= 0) return

    const intervalMs = intervalHours * 60 * 60 * 1000
    const lastBonus = lastBonusAt ? new Date(lastBonusAt).getTime() : 0

    const calc = () => {
      const remaining = Math.max(0, lastBonus + intervalMs - Date.now())
      setBonusSecs(Math.ceil(remaining / 1000))
      return remaining
    }

    calc()
    const id = setInterval(() => {
      const r = calc()
      if (r <= 0) {
        clearInterval(id)
        setTimeout(() => router.refresh(), 600)
      }
    }, 1000)

    return () => clearInterval(id)
  }, [lastBonusAt, intervalHours, bonusAmount, router])

  const hasDrip = bonusAmount > 0 && intervalHours > 0

  return (
    <div className="hidden sm:flex items-center gap-2">
      {/* Bonus drip countdown */}
      {hasDrip && bonusSecs !== null && (
        bonusSecs === 0 ? (
          <div className="flex items-center gap-1 text-xs text-violet-300 bg-violet-500/20 border border-violet-500/30 rounded-full px-2.5 py-1 animate-pulse">
            <span>✨</span>
            <span>+{bonusAmount} ready!</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-1">
            <span>⏱</span>
            <span className="font-mono">+{bonusAmount} in {fmt(bonusSecs)}</span>
          </div>
        )
      )}

      {/* Daily reset countdown */}
      <div className="flex items-center gap-1 text-xs text-amber-500/70 bg-amber-500/5 border border-amber-500/15 rounded-full px-2.5 py-1">
        <span>🌅</span>
        <span className="font-mono">{dailyTokens} in {fmt(dailySecs)}</span>
      </div>
    </div>
  )
}
