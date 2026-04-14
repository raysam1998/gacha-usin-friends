'use client'

import { useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────
interface CatData {
  x: number; y: number
  vx: number; vy: number
  rot: number; rotSpeed: number   // deg/sec — negative = CCW
  size: number; opacity: number
}

// ── Component ─────────────────────────────────────────────────
export default function ChipiCatOverlay({
  isActive, catCount, duration, volume, onComplete,
}: {
  isActive: boolean
  catCount: number
  duration: number   // seconds
  volume: number     // 0-1
  onComplete: () => void
}) {
  // slots = array of sizes; setting this triggers DOM render → then RAF starts
  const [slots, setSlots] = useState<number[]>([])

  const catRefs    = useRef<(HTMLDivElement | null)[]>([])
  const dataRef    = useRef<CatData[]>([])
  const rafRef     = useRef<number | undefined>(undefined)
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const cbRef      = useRef(onComplete)
  useEffect(() => { cbRef.current = onComplete }, [onComplete])

  // ── Step 1: on isActive → compute cat layout + trigger DOM render ──
  useEffect(() => {
    if (!isActive) {
      setSlots([])
      return
    }

    // Skip animation for users who prefer reduced motion — brief sound only
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const a = audioRef.current
      if (a) { a.volume = Math.min(1, Math.max(0, volume)); a.play().catch(() => {}) }
      const t = setTimeout(() => { a?.pause(); cbRef.current() }, 1500)
      return () => clearTimeout(t)
    }

    const vw = window.innerWidth
    const vh = window.innerHeight
    const n  = vw < 640 ? Math.max(1, Math.floor(catCount / 2)) : catCount

    dataRef.current = Array.from({ length: n }, () => {
      const size  = 70 + Math.random() * 70                    // 70-140 px
      const speed = 150 + Math.random() * 200                  // 150-350 px/s
      const angle = Math.random() * Math.PI * 2
      // Start from a random position inside the viewport so they're immediately visible
      return {
        x: Math.random() * (vw - size),
        y: Math.random() * (vh - size),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * 360,
        // 180-720 deg/s, random direction — some clockwise, some CCW
        rotSpeed: (180 + Math.random() * 540) * (Math.random() < 0.5 ? 1 : -1),
        size,
        opacity: 1,
      }
    })

    setSlots(dataRef.current.map(c => c.size))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, catCount])

  // ── Step 2: slots changed → DOM exists → start RAF ────────────
  useEffect(() => {
    if (slots.length === 0) return

    const audio = audioRef.current
    if (audio) {
      audio.volume = Math.min(1, Math.max(0, volume))
      audio.playbackRate = 1.18
      audio.currentTime = 0
      audio.loop = true
      audio.play().catch(() => {})
    }

    const durationMs = duration * 1000
    const EXIT_MS    = 800
    let startTime: number | null = null
    let lastTime:  number | null = null
    let exiting = false
    let fadeCleaned = false

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      if (lastTime  === null) lastTime  = now
      const dt = Math.min((now - lastTime) / 1000, 0.05)   // cap delta at 50ms
      lastTime = now

      const elapsed = now - startTime
      const vw = window.innerWidth
      const vh = window.innerHeight

      // Transition to exit phase
      if (elapsed >= durationMs && !exiting) {
        exiting = true
        if (audio && !fadeCleaned) {
          fadeCleaned = true
          const startVol = audio.volume
          const steps = EXIT_MS / 50
          const step  = startVol / steps
          let tick = 0
          const fade = setInterval(() => {
            if (!audio) { clearInterval(fade); return }
            audio.volume = Math.max(0, audio.volume - step)
            if (++tick >= steps) { audio.pause(); clearInterval(fade) }
          }, 50)
        }
      }

      const exitProg = exiting
        ? Math.min((elapsed - durationMs) / EXIT_MS, 1)
        : 0
      const spinMult = exiting ? 1 + exitProg * 4 : 1

      dataRef.current.forEach((cat, i) => {
        const el = catRefs.current[i]
        if (!el) return

        // Physics
        cat.x   += cat.vx * dt
        cat.y   += cat.vy * dt
        cat.rot += cat.rotSpeed * spinMult * dt

        // Bounce off viewport walls — DVD screensaver style
        if (cat.x <= 0)              { cat.x  = 0;            cat.vx =  Math.abs(cat.vx) }
        if (cat.x + cat.size >= vw)  { cat.x  = vw - cat.size; cat.vx = -Math.abs(cat.vx) }
        if (cat.y <= 0)              { cat.y  = 0;            cat.vy =  Math.abs(cat.vy) }
        if (cat.y + cat.size >= vh)  { cat.y  = vh - cat.size; cat.vy = -Math.abs(cat.vy) }

        cat.opacity = exiting ? Math.max(0, 1 - exitProg) : 1

        // Direct DOM update — no React state, no re-render
        el.style.transform = `translate(${cat.x}px, ${cat.y}px) rotate(${cat.rot}deg)`
        el.style.opacity   = String(cat.opacity)
      })

      if (exitProg >= 1) {
        cbRef.current()
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
      if (audio && !audio.paused) audio.pause()
    }
  // Re-run when slots are (re-)set; duration & volume are stable for a given activation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots])

  // Nothing to render when inactive + no slots
  if (!isActive && slots.length === 0) return null

  return (
    <div className="chipi-overlay" aria-hidden="true">
      {/* Hidden audio element — src can be absent; fails silently */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/audio/chipi-cat.mp3" preload="auto" />

      {slots.map((size, i) => (
        <div
          key={i}
          ref={el => { catRefs.current[i] = el }}
          className="chipi-cat"
          style={{ width: size, height: size }}
        >
          {/* Inner div: CSS beat-pulse (separate layer from RAF transform) */}
          <div className="chipi-cat-inner" style={{ animationDelay: `${(i * 73) % 430}ms` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/chipi-cat.gif"
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              onError={e => {
                // Fallback: replace with spinning emoji if GIF is missing
                const el = e.currentTarget
                el.style.display = 'none'
                const fb = el.parentElement
                if (fb && !fb.dataset.fallback) {
                  fb.dataset.fallback = '1'
                  fb.style.fontSize = `${size * 0.75}px`
                  fb.style.display = 'flex'
                  fb.style.alignItems = 'center'
                  fb.style.justifyContent = 'center'
                  fb.textContent = '🐱'
                }
              }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        .chipi-overlay {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 9999;
        }
        .chipi-cat {
          position: absolute;
          top: 0; left: 0;
          will-change: transform, opacity;
        }
        .chipi-cat-inner {
          width: 100%; height: 100%;
          animation: chipi-pulse 430ms ease-in-out infinite;
        }
        @keyframes chipi-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
