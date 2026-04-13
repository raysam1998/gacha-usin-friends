'use client'

import { useActionState, useEffect, useState } from 'react'
import { submitNewsMessageAction } from '@/app/actions/news'

export default function UserNewsSubmit({
  lastSubmitAt,
  cooldownMinutes,
  autoActive,
}: {
  lastSubmitAt: string | null
  cooldownMinutes: number
  autoActive: boolean
}) {
  const [state, action, pending] = useActionState(submitNewsMessageAction, null)
  const [secsLeft, setSecsLeft] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [value, setValue] = useState('')

  // Compute initial cooldown from server-provided lastSubmitAt
  useEffect(() => {
    if (!lastSubmitAt) return
    const cooldownMs = cooldownMinutes * 60 * 1000
    const calc = () => {
      const elapsed = Date.now() - new Date(lastSubmitAt).getTime()
      const left = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000))
      setSecsLeft(left)
    }
    calc()
    if (Date.now() - new Date(lastSubmitAt).getTime() < cooldownMs) {
      const id = setInterval(calc, 1000)
      return () => clearInterval(id)
    }
  }, [lastSubmitAt, cooldownMinutes])

  // If server returned a cooldown, override countdown
  useEffect(() => {
    if (state?.cooldownSecsLeft) {
      setSecsLeft(state.cooldownSecsLeft)
    }
    if (state?.success) {
      setValue('')
      setCharCount(0)
    }
  }, [state])

  // Count down
  useEffect(() => {
    if (secsLeft <= 0) return
    const id = setInterval(() => setSecsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secsLeft])

  const blocked = secsLeft > 0
  const fmtCooldown = secsLeft >= 60
    ? `${Math.floor(secsLeft / 60)}m ${secsLeft % 60}s`
    : `${secsLeft}s`

  return (
    <div className="news-submit-wrap">
      <div className="news-submit-header">
        <span className="news-submit-icon">📡</span>
        <div>
          <div className="news-submit-title">Submit to the Ticker</div>
          <div className="news-submit-sub">
            {autoActive ? 'Goes live immediately' : 'Pending admin approval'} · {cooldownMinutes}min cooldown
          </div>
        </div>
      </div>

      <form action={action} className="news-submit-form">
        <div className="news-submit-input-row">
          <input
            name="message"
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setCharCount(e.target.value.length) }}
            placeholder="Type your breaking news…"
            maxLength={280}
            disabled={blocked || pending}
            className="news-submit-input"
          />
          <button
            type="submit"
            disabled={blocked || pending || !value.trim()}
            className="news-submit-btn"
          >
            {pending ? '…' : blocked ? `⏳ ${fmtCooldown}` : 'Send'}
          </button>
        </div>
        <div className="news-submit-meta">
          <span className={charCount > 250 ? 'char-warn' : 'char-ok'}>{charCount}/280</span>
          {state?.error && <span className="news-submit-err">{state.error}</span>}
          {state?.success && <span className="news-submit-ok">{state.success}</span>}
        </div>
      </form>

      <style jsx>{`
        .news-submit-wrap { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 16px; }
        .news-submit-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .news-submit-icon { font-size: 20px; }
        .news-submit-title { font-size: 13px; font-weight: 600; color: #fff; }
        .news-submit-sub { font-size: 11px; color: rgba(255,255,255,0.35); }
        .news-submit-form { display: flex; flex-direction: column; gap: 6px; }
        .news-submit-input-row { display: flex; gap: 8px; }
        .news-submit-input { flex: 1; padding: 9px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #fff; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .news-submit-input:focus { border-color: rgba(193,39,45,0.6); }
        .news-submit-input::placeholder { color: rgba(255,255,255,0.2); }
        .news-submit-input:disabled { opacity: 0.4; }
        .news-submit-btn { padding: 9px 20px; background: #C1272D; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; min-width: 72px; }
        .news-submit-btn:hover:not(:disabled) { opacity: 0.85; }
        .news-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .news-submit-meta { display: flex; align-items: center; gap: 12px; min-height: 16px; }
        .char-ok { font-size: 11px; color: rgba(255,255,255,0.2); }
        .char-warn { font-size: 11px; color: rgba(255,160,0,0.8); }
        .news-submit-err { font-size: 11px; color: rgba(220,80,80,0.9); }
        .news-submit-ok  { font-size: 11px; color: rgba(80,200,120,0.9); }
      `}</style>
    </div>
  )
}
