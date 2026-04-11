'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { pullCardAction, type PullResult } from '@/app/actions/gacha'

// ── Config ────────────────────────────────────────────────────
const FLIP_DURATION_MS: Record<string, number> = {
  common: 600, rare: 900, epic: 1100, legendary: 1600,
}
const PAUSE_BEFORE_FLIP_MS: Record<string, number> = {
  common: 400, rare: 600, epic: 800, legendary: 1100,
}
const RARITY_PARTICLES: Record<string, { color: string; glow: string; count: number; spread: number }> = {
  common:    { color: '#9ca3af', glow: '#9ca3af', count: 12,  spread: 110 },
  rare:      { color: '#60a5fa', glow: '#3b82f6', count: 22,  spread: 150 },
  epic:      { color: '#c084fc', glow: '#a855f7', count: 35,  spread: 180 },
  legendary: { color: '#fbbf24', glow: '#f59e0b', count: 55,  spread: 220 },
}
const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-amber-400',
}
const RARITY_GLOW: Record<string, React.CSSProperties> = {
  common:    { boxShadow: '0 0 20px rgba(107,114,128,0.4)' },
  rare:      { boxShadow: '0 0 35px rgba(96,165,250,0.65), 0 0 70px rgba(59,130,246,0.2)' },
  epic:      { boxShadow: '0 0 45px rgba(192,132,252,0.75), 0 0 90px rgba(168,85,247,0.3)' },
  legendary: { boxShadow: '0 0 70px rgba(251,191,36,0.85), 0 0 140px rgba(245,158,11,0.4)' },
}
const RARITY_BADGE: Record<string, string> = {
  common:    'bg-gray-800 text-gray-300',
  rare:      'bg-blue-900/80 text-blue-200',
  epic:      'bg-purple-900/80 text-purple-200',
  legendary: 'bg-amber-900/80 text-amber-200',
}
const RARITY_LABEL: Record<string, string> = {
  common: 'GOT ONE', rare: '✦ RARE', epic: '◈ EPIC', legendary: '★ LEGENDARY',
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Particles ─────────────────────────────────────────────────
function ParticleBurst({ rarity }: { rarity: string }) {
  const cfg = RARITY_PARTICLES[rarity] ?? RARITY_PARTICLES.common
  const particles = Array.from({ length: cfg.count }, (_, i) => {
    const angle = (i / cfg.count) * Math.PI * 2 + Math.random() * 0.3
    const dist = cfg.spread * (0.5 + Math.random() * 0.5)
    return {
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      size: 3 + Math.random() * 7,
      dur: 0.7 + Math.random() * 0.7,
      delay: Math.random() * 0.25,
    }
  })

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-2xl">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            background: cfg.color,
            boxShadow: `0 0 ${p.size * 2}px ${cfg.glow}`,
            animation: `particle-fly ${p.dur}s ${p.delay}s ease-out forwards`,
            '--tx': `${p.tx}px`, '--ty': `${p.ty}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ── Light rays (rare+) ─────────────────────────────────────────
function LightRays({ rarity }: { rarity: string }) {
  if (rarity === 'common') return null
  const colors: Record<string, string> = { rare: '#60a5fa', epic: '#c084fc', legendary: '#fbbf24' }
  const color = colors[rarity] ?? '#fff'
  const count = rarity === 'legendary' ? 14 : rarity === 'epic' ? 10 : 6
  const height = rarity === 'legendary' ? 350 : 240

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="absolute"
          style={{
            bottom: '50%', left: '50%',
            width: 2 + (rarity === 'legendary' ? 1 : 0),
            height,
            background: `linear-gradient(to top, ${color}cc, transparent)`,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${(i / count) * 360}deg)`,
            animation: `light-ray 1.2s ${i * 0.04}s ease-out forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

// ── Card back ─────────────────────────────────────────────────
function CardBack({ isWaiting }: { isWaiting: boolean }) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-gray-900 via-violet-950/30 to-gray-950 flex flex-col items-center justify-center border-2 border-violet-500/20 ${isWaiting ? 'animate-glow-pulse' : ''}`}>
      <div className="text-5xl mb-3 opacity-60">🎴</div>
      <div className="text-gradient font-black text-xl tracking-widest">GUF</div>
      <div className="text-gray-700 text-xs mt-2 font-mono">???</div>
      {isWaiting && (
        <div className="flex gap-1.5 mt-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-500 dot-pulse"
              style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Card front ────────────────────────────────────────────────
function CardFront({ card }: { card: NonNullable<PullResult['card']> }) {
  return (
    <div className={`w-full h-full flex flex-col border-2 ${RARITY_BORDER[card.rarity] ?? 'border-gray-600'}`}
      style={RARITY_GLOW[card.rarity]}>
      <div className="flex-1 relative">
        <Image src={card.image_url} alt={card.variant_name} fill className="object-cover" priority />
      </div>
      <div className="bg-gray-950/95 px-4 py-3 shrink-0">
        <div className="font-black text-white text-sm leading-tight">{card.character.name}</div>
        <div className="text-gray-400 text-xs mt-0.5">{card.variant_name}</div>
        <div className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-bold ${RARITY_BADGE[card.rarity]}`}>
          {card.rarity.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

// ── Main machine ──────────────────────────────────────────────
type Phase = 'idle' | 'waiting' | 'revealing' | 'revealed'

export default function PullMachine({
  initialTokens,
  initialPity,
  pityThreshold,
  pullCost,
}: {
  initialTokens: number
  initialPity: number
  pityThreshold: number
  pullCost: number
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<PullResult | null>(null)
  const [tokens, setTokens] = useState(initialTokens)
  const [pity, setPity] = useState(initialPity)
  const [flipped, setFlipped] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [showShake, setShowShake] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenPop, setTokenPop] = useState(false)

  const rarity = result?.card?.rarity ?? 'common'
  const flipDuration = FLIP_DURATION_MS[rarity] ?? 700
  const isLegendary = rarity === 'legendary'
  const isEpicPlus = rarity === 'epic' || isLegendary

  const handlePull = useCallback(async () => {
    setError(null)
    setResult(null)
    setFlipped(false)
    setShowEffects(false)
    setShowShake(false)
    setPhase('waiting')

    const res = await pullCardAction()

    if (res.error) {
      setPhase('idle')
      setError(res.error)
      return
    }

    setResult(res)
    setTokens(res.newTokenCount)
    setPity(res.newPityCounter)

    // Dramatic pause — let face-down card breathe
    await delay(PAUSE_BEFORE_FLIP_MS[res.card?.rarity ?? 'common'] ?? 500)

    // Start flip (legendary uses a special CSS animation instead)
    setPhase('revealing')
    setFlipped(true)

    // Mid-flip: trigger effects
    await delay(flipDuration * 0.45)
    setShowEffects(true)
    if (res.card?.rarity === 'epic' || res.card?.rarity === 'legendary') {
      setShowShake(true)
      await delay(750)
      setShowShake(false)
    }

    // Flip done
    await delay(flipDuration * 0.55 + 100)
    setPhase('revealed')

    // Token pop animation
    setTokenPop(true)
    await delay(400)
    setTokenPop(false)
  }, [flipDuration])

  const handleReset = () => {
    setPhase('idle')
    setResult(null)
    setFlipped(false)
    setShowEffects(false)
    setShowShake(false)
    setError(null)
  }

  const canPull = tokens >= pullCost

  return (
    <div className="relative min-h-screen bg-[#08080f] flex flex-col items-center justify-center px-4 py-8">

      {/* Legendary full-screen flash */}
      {phase === 'revealing' && isLegendary && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            animation: 'legendary-flash 2s ease-out forwards',
            background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.7) 0%, rgba(245,158,11,0.35) 40%, transparent 75%)',
          }}
        />
      )}

      {/* Token + pity HUD */}
      <div className="w-full max-w-sm flex items-center justify-between mb-8">
        <div className={`flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 ${tokenPop ? 'animate-token-pop' : ''}`}>
          <span className="text-lg">🪙</span>
          <span className="text-amber-400 font-black text-lg">{tokens}</span>
        </div>
        {phase === 'idle' || phase === 'revealed' ? (
          <div className="text-gray-600 text-xs text-right">
            {pity > 0 && (
              <span className="text-gray-500">
                epic+ in <span className="text-violet-400 font-bold">{pityThreshold - pity}</span> pulls
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Card stage */}
      <div
        className={`relative mb-8 ${showShake ? 'animate-shake' : ''}`}
        style={{ width: 220, height: 308 }}
      >
        {phase === 'idle' ? (
          /* Ghost card placeholder */
          <div className="w-full h-full rounded-2xl border-2 border-dashed border-violet-500/20 flex items-center justify-center">
            <span className="text-6xl opacity-20">🃏</span>
          </div>

        ) : phase === 'waiting' ? (
          /* Face-down, waiting for server */
          <div className="card-scene w-full h-full">
            <div className="card-inner">
              <div className="card-face"><CardBack isWaiting={true} /></div>
            </div>
          </div>

        ) : (phase === 'revealing' || phase === 'revealed') && result?.card ? (
          isLegendary && phase === 'revealing' ? (
            /* Legendary: skip standard flip, do the pop-in directly */
            <div className="w-full h-full rounded-2xl overflow-hidden animate-legendary-pop relative z-50"
              style={RARITY_GLOW.legendary}>
              <CardFront card={result.card} />
              {showEffects && <><ParticleBurst rarity="legendary" /><LightRays rarity="legendary" /></>}
            </div>
          ) : (
            /* Standard 3D flip */
            <div className="card-scene w-full h-full">
              <div
                className="card-inner"
                style={{
                  transform: flipped ? 'rotateY(180deg)' : 'none',
                  transition: `transform ${flipDuration}ms cubic-bezier(0.4, 0.2, 0.2, 1)`,
                }}
              >
                {/* Back */}
                <div className="card-face"><CardBack isWaiting={false} /></div>
                {/* Front (rotated 180 initially, becomes visible on flip) */}
                <div className="card-face card-face-back">
                  <CardFront card={result.card} />
                </div>
              </div>
              {showEffects && (
                <div className="absolute inset-0 pointer-events-none">
                  <ParticleBurst rarity={rarity} />
                  {isEpicPlus && <LightRays rarity={rarity} />}
                </div>
              )}
            </div>
          )

        ) : null}
      </div>

      {/* Revealed info + actions */}
      {phase === 'revealed' && result?.card && (
        <div className="w-full max-w-sm space-y-3 text-center animate-float" style={{ animationDuration: '0s' }}>
          {/* Rarity headline */}
          <div className={`text-2xl font-black tracking-widest ${
            isLegendary ? 'text-gradient-gold text-3xl' :
            rarity === 'epic' ? 'text-gradient text-2xl' :
            rarity === 'rare' ? 'text-blue-300' : 'text-gray-300'
          }`}>
            {RARITY_LABEL[rarity]}
          </div>

          {/* Pity note */}
          {result.isPityPull && (
            <div className="text-xs text-violet-400 bg-violet-900/20 border border-violet-500/20 rounded-full px-3 py-1 inline-block">
              pity pull activated
            </div>
          )}

          {/* Dupe warning */}
          {result.isDuplicate && (
            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-2">
              you already have this card — head to collection to reroll dupes
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {canPull ? (
              <button
                onClick={handlePull}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/30 text-sm tracking-wide active:scale-95"
              >
                PULL AGAIN
              </button>
            ) : (
              <div className="flex-1 text-center py-3.5 text-gray-600 text-sm border border-gray-800 rounded-xl">
                out of tokens
              </div>
            )}
            <Link
              href="/collection"
              className="flex-1 text-center border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white py-3.5 rounded-xl transition-colors text-sm font-semibold"
            >
              collection
            </Link>
          </div>
        </div>
      )}

      {/* Idle state: PULL button */}
      {phase === 'idle' && (
        <div className="w-full max-w-sm space-y-3 text-center">
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button
            onClick={handlePull}
            disabled={!canPull}
            className={`w-full py-5 rounded-2xl font-black text-xl tracking-widest transition-all active:scale-95 ${
              canPull
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white hover:shadow-2xl hover:shadow-violet-500/40 animate-glow-pulse'
                : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'
            }`}
          >
            {canPull ? 'PULL' : 'NO TOKENS'}
          </button>
          <p className="text-gray-600 text-xs">
            costs {pullCost} token{pullCost !== 1 ? 's' : ''} per pull
          </p>
        </div>
      )}

      {/* Waiting: no button shown, card is spinning */}
    </div>
  )
}
