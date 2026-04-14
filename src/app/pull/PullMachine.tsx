'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { pullCardAction, adminForcePullAction, type PullResult } from '@/app/actions/gacha'
import ChipiCatOverlay from '@/components/ChipiCatOverlay'

// ── Config ────────────────────────────────────────────────────
const HALF_FLIP_MS: Record<string, number> = {
  common: 280, rare: 380, epic: 480, legendary: 0, // legendary skips flip
}
const PAUSE_MS: Record<string, number> = {
  common: 350, rare: 550, epic: 750, legendary: 900,
}
const RARITY_PARTICLES: Record<string, { color: string; glow: string; count: number; spread: number }> = {
  common:    { color: '#9ca3af', glow: '#9ca3af', count: 12,  spread: 110 },
  rare:      { color: '#60a5fa', glow: '#3b82f6', count: 22,  spread: 150 },
  epic:      { color: '#c084fc', glow: '#a855f7', count: 35,  spread: 180 },
  legendary: { color: '#fbbf24', glow: '#f59e0b', count: 55,  spread: 230 },
}
const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500', rare: 'border-blue-400',
  epic: 'border-purple-400', legendary: 'border-amber-400',
}
const RARITY_GLOW: Record<string, React.CSSProperties> = {
  common:    { boxShadow: '0 0 20px rgba(107,114,128,0.4)' },
  rare:      { boxShadow: '0 0 35px rgba(96,165,250,0.65), 0 0 70px rgba(59,130,246,0.2)' },
  epic:      { boxShadow: '0 0 45px rgba(192,132,252,0.75), 0 0 90px rgba(168,85,247,0.3)' },
  legendary: { boxShadow: '0 0 70px rgba(251,191,36,0.85), 0 0 140px rgba(245,158,11,0.4)' },
}
const RARITY_BADGE: Record<string, string> = {
  common: 'bg-gray-800 text-gray-300', rare: 'bg-blue-900/80 text-blue-200',
  epic: 'bg-purple-900/80 text-purple-200', legendary: 'bg-amber-900/80 text-amber-200',
}
const RARITY_LABEL: Record<string, string> = {
  common: 'GOT ONE', rare: '✦ RARE', epic: '◈ EPIC', legendary: '★ LEGENDARY',
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

type AdminCard = { id: string; variant_name: string; rarity: string; character: { name: string } }
const RARITY_ORDER = ['legendary', 'epic', 'rare', 'common']

// ── Particles ─────────────────────────────────────────────────
function ParticleBurst({ rarity, multiplier = 1 }: { rarity: string; multiplier?: number }) {
  const cfg = RARITY_PARTICLES[rarity] ?? RARITY_PARTICLES.common
  const count = Math.max(0, Math.round(cfg.count * multiplier))
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / cfg.count) * Math.PI * 2 + Math.random() * 0.3
    const dist = cfg.spread * (0.5 + Math.random() * 0.5)
    return {
      id: i, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist,
      size: 3 + Math.random() * 7, dur: 0.7 + Math.random() * 0.7, dl: Math.random() * 0.25,
    }
  })
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full"
          style={{
            width: p.size, height: p.size, background: cfg.color,
            boxShadow: `0 0 ${p.size * 2}px ${cfg.glow}`,
            animation: `particle-fly ${p.dur}s ${p.dl}s ease-out forwards`,
            '--tx': `${p.tx}px`, '--ty': `${p.ty}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ── Light rays ─────────────────────────────────────────────────
function LightRays({ rarity }: { rarity: string }) {
  if (rarity === 'common') return null
  const colors: Record<string, string> = { rare: '#60a5fa', epic: '#c084fc', legendary: '#fbbf24' }
  const color = colors[rarity] ?? '#fff'
  const count = rarity === 'legendary' ? 14 : rarity === 'epic' ? 10 : 6
  const height = rarity === 'legendary' ? 380 : 250
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="absolute"
          style={{
            bottom: '50%', left: '50%', width: 2, height,
            background: `linear-gradient(to top, ${color}bb, transparent)`,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${(i / count) * 360}deg)`,
            animation: `light-ray 1.3s ${i * 0.04}s ease-out forwards`,
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
    <div className={`w-full h-full rounded-2xl bg-gradient-to-br from-gray-900 via-violet-950/30 to-gray-950 flex flex-col items-center justify-center border-2 border-violet-500/20 ${isWaiting ? 'animate-glow-pulse' : ''}`}>
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
    <div className={`w-full h-full rounded-2xl flex flex-col border-2 overflow-hidden ${RARITY_BORDER[card.rarity] ?? 'border-gray-600'}`}
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
type FlipHalf = 'none' | 'first' | 'second'

export default function PullMachine({
  initialTokens, initialPity, pityThreshold, pullCost, catConfig, isAdmin = false, allCards = [], particleMultiplier = 1,
}: {
  initialTokens: number; initialPity: number; pityThreshold: number; pullCost: number
  catConfig: { count: number; duration: number; volume: number }
  isAdmin?: boolean; allCards?: AdminCard[]
  particleMultiplier?: number
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<PullResult | null>(null)
  const [tokens, setTokens] = useState(initialTokens)
  const [pity, setPity] = useState(initialPity)
  const [error, setError] = useState<string | null>(null)
  const [tokenPop, setTokenPop] = useState(false)

  // Single-face flip state
  const [showFront, setShowFront] = useState(false)
  const [cardRotation, setCardRotation] = useState(0)
  const [flipHalf, setFlipHalf] = useState<FlipHalf>('none')

  // Effects state
  const [showEffects, setShowEffects] = useState(false)
  const [showShake, setShowShake] = useState(false)
  const [showLegendaryFlash, setShowLegendaryFlash] = useState(false)
  const [legendaryPop, setLegendaryPop] = useState(false)
  const [showChipi, setShowChipi] = useState(false)

  // Admin force-pull state
  const [adminOpen, setAdminOpen] = useState(false)
  const [forceRarity, setForceRarity] = useState('')
  const [forceCardId, setForceCardId] = useState('')

  const handlePull = useCallback(async () => {
    setError(null)
    setResult(null)
    setShowFront(false)
    setCardRotation(0)
    setFlipHalf('none')
    setShowEffects(false)
    setShowShake(false)
    setShowLegendaryFlash(false)
    setLegendaryPop(false)
    setShowChipi(false)
    setPhase('waiting')

    const res = (isAdmin && (forceRarity || forceCardId))
      ? await adminForcePullAction({ forceRarity: forceRarity || undefined, forceCardId: forceCardId || undefined })
      : await pullCardAction()

    if (res.error) {
      setPhase('idle')
      setError(res.error)
      return
    }

    setResult(res)
    setTokens(res.newTokenCount)
    setPity(res.newPityCounter)

    const cardRarity = res.card?.rarity ?? 'common'
    const halfDur = HALF_FLIP_MS[cardRarity] ?? 300

    // Dramatic pause
    await delay(PAUSE_MS[cardRarity] ?? 500)
    setPhase('revealing')

    if (cardRarity === 'legendary') {
      // Legendary: skip flip — just flash + pop in
      setShowLegendaryFlash(true)
      await delay(200)
      setLegendaryPop(true)
      setShowFront(true)
      setShowChipi(true)   // 🐱 cats invade as the card pops
      await delay(400)
      setShowEffects(true)
      setShowShake(true)
      await delay(800)
      setShowShake(false)
      await delay(600)
      setShowLegendaryFlash(false)
      setPhase('revealed')
    } else {
      // Standard single-face flip:
      // 1) Rotate to 90° (disappear)
      setFlipHalf('first')
      setCardRotation(90)
      await delay(halfDur)

      // 2) Swap to front, jump to -90° instantly (no transition)
      setShowFront(true)
      setFlipHalf('none')
      setCardRotation(-90)

      // 3) Wait a frame, then rotate from -90° to 0° (reappear)
      await delay(30)
      setFlipHalf('second')
      setCardRotation(0)

      // Mid-reveal: trigger effects
      await delay(halfDur * 0.4)
      setShowEffects(true)
      if (cardRarity === 'epic') {
        setShowShake(true)
        await delay(700)
        setShowShake(false)
      }

      await delay(halfDur * 0.6 + 50)
      setFlipHalf('none')
      setPhase('revealed')
    }

    // Token count pop
    setTokenPop(true)
    await delay(400)
    setTokenPop(false)
  }, [isAdmin, forceRarity, forceCardId])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setResult(null)
    setShowFront(false)
    setCardRotation(0)
    setFlipHalf('none')
    setShowEffects(false)
    setShowShake(false)
    setShowLegendaryFlash(false)
    setLegendaryPop(false)
    setShowChipi(false)
    setError(null)
  }, [])

  const isForcePull = isAdmin && (!!forceRarity || !!forceCardId)
  const canPull = tokens >= pullCost || isForcePull
  const rarity = result?.card?.rarity ?? 'common'

  const cardTransition =
    flipHalf === 'first'  ? `transform ${HALF_FLIP_MS[rarity] ?? 300}ms ease-in` :
    flipHalf === 'second' ? `transform ${HALF_FLIP_MS[rarity] ?? 300}ms ease-out` :
    'none'

  return (
    <div className="relative min-h-screen bg-[#08080f] flex flex-col items-center justify-center px-4 py-8">

      {/* Legendary full-screen flash */}
      {showLegendaryFlash && (
        <div className="fixed inset-0 z-40 pointer-events-none"
          style={{
            animation: 'legendary-flash 2.2s ease-out forwards',
            background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.75) 0%, rgba(245,158,11,0.35) 45%, transparent 75%)',
          }}
        />
      )}

      {/* 🐱 Chipi Chipi Chapa Chapa overlay */}
      <ChipiCatOverlay
        isActive={showChipi}
        catCount={catConfig.count}
        duration={catConfig.duration}
        volume={catConfig.volume}
        onComplete={() => setShowChipi(false)}
      />

      {/* Token + pity HUD */}
      <div className="w-full max-w-sm flex items-center justify-between mb-8">
        <div className={`flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 ${tokenPop ? 'animate-token-pop' : ''}`}>
          <span className="text-lg">🪙</span>
          <span className="text-amber-400 font-black text-lg">{tokens}</span>
        </div>
        {(phase === 'idle' || phase === 'revealed') && pity > 0 && (
          <span className="text-gray-500 text-xs">
            epic+ in <span className="text-violet-400 font-bold">{pityThreshold - pity}</span> pulls
          </span>
        )}
      </div>

      {/* Card stage */}
      <div className={`relative mb-8 ${showShake ? 'animate-shake' : ''}`}
        style={{ width: 220, height: 308 }}>

        {phase === 'idle' ? (
          <div className="w-full h-full rounded-2xl border-2 border-dashed border-violet-500/20 flex items-center justify-center">
            <span className="text-6xl opacity-20">🃏</span>
          </div>

        ) : (
          /* Single face, rotates around Y axis */
          <div style={{ perspective: '1200px', width: '100%', height: '100%' }}>
            <div style={{
              width: '100%', height: '100%',
              transform: `rotateY(${cardRotation}deg)`,
              transition: cardTransition,
              transformOrigin: 'center center',
            }}>
              {legendaryPop ? (
                <div className="w-full h-full animate-legendary-pop">
                  {result?.card && <CardFront card={result.card} />}
                </div>
              ) : showFront && result?.card ? (
                <CardFront card={result.card} />
              ) : (
                <CardBack isWaiting={phase === 'waiting'} />
              )}
            </div>

            {/* Effects overlay */}
            {showEffects && result?.card && (
              <div className="absolute inset-0 pointer-events-none">
                <ParticleBurst rarity={rarity} multiplier={particleMultiplier} />
                {(rarity === 'epic' || rarity === 'legendary') && <LightRays rarity={rarity} />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revealed info */}
      {phase === 'revealed' && result?.card && (
        <div className="w-full max-w-sm space-y-3 text-center">
          <div className={`text-2xl font-black tracking-widest ${
            rarity === 'legendary' ? 'text-gradient-gold text-3xl' :
            rarity === 'epic' ? 'text-gradient text-2xl' :
            rarity === 'rare' ? 'text-blue-300' : 'text-gray-300'
          }`}>
            {RARITY_LABEL[rarity]}
          </div>

          {result.isPityPull && (
            <div className="text-xs text-violet-400 bg-violet-900/20 border border-violet-500/20 rounded-full px-3 py-1 inline-block">
              pity pull activated
            </div>
          )}
          {result.isDuplicate && (
            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-2">
              you already have this — head to collection to reroll dupes
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {canPull ? (
              <button onClick={handlePull}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/30 text-sm tracking-wide active:scale-95">
                PULL AGAIN
              </button>
            ) : (
              <div className="flex-1 text-center py-3.5 text-gray-600 text-sm border border-gray-800 rounded-xl">
                out of tokens
              </div>
            )}
            <Link href="/collection"
              className="flex-1 text-center border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white py-3.5 rounded-xl transition-colors text-sm font-semibold flex items-center justify-center">
              collection
            </Link>
          </div>
        </div>
      )}

      {/* Idle: PULL button */}
      {phase === 'idle' && (
        <div className="w-full max-w-sm space-y-3 text-center">
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
          )}
          <button onClick={handlePull} disabled={!canPull}
            className={`w-full py-5 rounded-2xl font-black text-xl tracking-widest transition-all active:scale-95 ${
              isForcePull
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white hover:shadow-2xl hover:shadow-amber-500/40'
                : canPull
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white hover:shadow-2xl hover:shadow-violet-500/40 animate-glow-pulse'
                  : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'
            }`}>
            {isForcePull ? 'FORCE PULL' : canPull ? 'PULL' : 'NO TOKENS'}
          </button>
          <p className="text-gray-600 text-xs">{isForcePull ? 'free · admin force pull' : `costs ${pullCost} token${pullCost !== 1 ? 's' : ''} per pull`}</p>

          {/* Admin panel */}
          {isAdmin && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setAdminOpen(o => !o)}
                className="text-gray-600 hover:text-gray-400 text-xs font-mono transition-colors"
              >
                {adminOpen ? '▾' : '▸'} admin
              </button>
              {adminOpen && (
                <div className="mt-2 bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-2 text-left">
                  {/* Force rarity */}
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">Force rarity</label>
                    <select
                      value={forceRarity}
                      onChange={e => { setForceRarity(e.target.value); setForceCardId('') }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="">— normal pull —</option>
                      {RARITY_ORDER.map(r => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  {/* Force specific card */}
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">Force specific card <span className="text-gray-700">(overrides rarity)</span></label>
                    <select
                      value={forceCardId}
                      onChange={e => { setForceCardId(e.target.value); setForceRarity('') }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="">— none —</option>
                      {RARITY_ORDER.flatMap(r => {
                        const group = allCards.filter(c => c.rarity === r)
                        if (!group.length) return []
                        return [
                          <option key={`__${r}`} disabled className="text-gray-600">── {r.toUpperCase()} ──</option>,
                          ...group.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.character.name} — {c.variant_name}
                            </option>
                          )),
                        ]
                      })}
                    </select>
                  </div>
                  {(forceRarity || forceCardId) && (
                    <button
                      type="button"
                      onClick={() => { setForceRarity(''); setForceCardId('') }}
                      className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
                    >
                      ✕ clear
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
