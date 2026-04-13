'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';

const FALLBACK_NEWS = [
  'BREAKING: Kevin pulled an Epic for the 4th time today. Experts baffled.',
  'URGENT: Someone actually used all their daily tokens before noon. Investigation underway.',
  'Community votes to add card of Kevin sleeping. Motion passes unanimously.',
  'LIVE UPDATE: Admin spotted adding more cards at 3 AM. Sources say "unstoppable."',
  'LOCAL MAN claims he "deserved" that Legendary pull. Friends disagree.',
  'Scientists confirm: the gacha rates are NOT rigged. (Source: the admin)',
  'Token drip hits. Collective serotonin spike detected across all 10 users.',
  'DEVELOPING: New card proposal features Kevin\'s cat. 7 yay votes in 2 minutes.',
  'JUST IN: Player pulls 3 Commons in a row. Declares "game is broken." Touches grass.',
  'Tragedy strikes as daily reset occurs mid-pull. Nation mourns.',
  'EXCLUSIVE: Leaked DMs reveal admin plays his own gacha. Conflict of interest?',
  'A moment of silence for the tokens wasted on Common pulls today.',
];

interface NewsMsg { id: string; message: string; created_at: string; }

export default function NewsTicker() {
  const [messages, setMessages]   = useState<string[]>(FALLBACK_NEWS);
  const [spacing, setSpacing]     = useState(32);   // px padding per side on each item
  const [copies, setCopies]       = useState(2);    // auto-scaled to fill viewport
  const [currentTime, setCurrentTime] = useState('');

  // RAF refs — mutable, no re-render needed
  const innerRef   = useRef<HTMLDivElement>(null);
  const posRef     = useRef(0);
  const rafRef     = useRef<number | undefined>(undefined);
  const pausedRef  = useRef(false);
  const speedRef   = useRef(80);  // px/sec — updated from DB without restarting animation
  const setWidRef  = useRef(0);   // width of ONE set of messages

  // ── Fetch messages + config, subscribe to changes ───────────────────────
  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const [newsRes, cfgRes] = await Promise.all([
        supabase
          .from('news_messages')
          .select('id, message, created_at')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('gacha_config')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select('ticker_speed, ticker_spacing' as any)
          .single(),
      ]);

      if (newsRes.data && newsRes.data.length > 0) {
        setMessages(newsRes.data.map((n: NewsMsg) => n.message));
      }
      if (cfgRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = cfgRes.data as any;
        speedRef.current = cfg.ticker_speed  ?? 80;
        setSpacing(cfg.ticker_spacing ?? 32);
      }
    }

    fetchData();

    const channel = supabase
      .channel('news-ticker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_messages' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gacha_config' },  fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Auto-scale copies until one set fills the visible area ───────────────
  // Runs after render when messages or copies change.
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || copies >= 8) return;

    const oneSetWidth   = inner.scrollWidth / copies;
    const visibleWidth  = (inner.parentElement as HTMLElement | null)?.clientWidth ?? 0;

    if (oneSetWidth < visibleWidth) {
      setCopies(c => c * 2);
    }
  }, [messages, copies, spacing]);

  // ── RAF animation — restart when messages/copies/spacing change ──────────
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    posRef.current = 0;

    // Defer one frame so the DOM reflects the latest copies/spacing render
    const setupId = requestAnimationFrame(() => {
      setWidRef.current = inner.scrollWidth / copies;  // width of ONE message set

      let lastTime: number | null = null;

      const tick = (now: number) => {
        if (lastTime !== null && !pausedRef.current && setWidRef.current > 0) {
          const delta = now - lastTime;
          posRef.current += (speedRef.current * delta) / 1000;
          if (posRef.current >= setWidRef.current) {
            posRef.current -= setWidRef.current;   // seamless reset
          }
          inner.style.transform = `translateX(-${posRef.current}px)`;
        }
        lastTime = now;
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(setupId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [messages, copies, spacing]);

  // ── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Build the looped message array
  const loopMessages = Array.from({ length: copies }).flatMap(() => messages);

  return (
    <div className="ticker-container">
      <div className="chyron">
        <div className="chyron-top">

          {/* Logo */}
          <div className="logo-section">
            <svg width="36" height="36" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#2d6a2e" strokeWidth="3.5" />
              <path d="M50 8 A42 42 0 0 1 92 50" fill="none" stroke="#C1272D" strokeWidth="3.5" />
              <circle cx="50" cy="50" r="32" fill="#0d1117" />
              <text x="35" y="42" fontFamily="Arial,sans-serif" fontSize="26" fontWeight="700" fill="#2d9e2d">C</text>
              <text x="52" y="58" fontFamily="Arial,sans-serif" fontSize="26" fontWeight="700" fill="#C1272D">A</text>
            </svg>
          </div>

          {/* Badge */}
          <div className="badge-section">
            <span className="badge-dot" />
            <span className="badge-text">الأخبار</span>
            <span className="badge-divider">|</span>
            <span className="badge-sub">LIVE</span>
          </div>

          {/* Scrolling text */}
          <div
            className="scroll-section"
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            <div ref={innerRef} className="scroll-inner">
              {loopMessages.map((msg, i) => (
                <span key={i} className="news-item" style={{ padding: `0 ${spacing}px` }}>
                  <span className="news-diamond">&#x25C6;</span>
                  {msg}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="chyron-bottom">
          <div className="bottom-left">
            <span className="bottom-title">الأخبار</span>
            <span className="bottom-sep">|</span>
            <span className="bottom-app">GACHA USIN FRIENDS</span>
          </div>
          <span className="bottom-time">{currentTime}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .ticker-container { width: 100%; padding: 0; margin: 8px 0; }
        .chyron { border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
        .chyron-top { display: flex; align-items: stretch; height: 48px; }
        .logo-section { background: #0a0a12; display: flex; align-items: center; justify-content: center; padding: 0 8px; flex-shrink: 0; width: 54px; border-right: 1px solid rgba(255,255,255,0.06); }
        .badge-section { background: #C1272D; color: #fff; display: flex; align-items: center; gap: 8px; padding: 0 16px 0 14px; flex-shrink: 0; position: relative; z-index: 2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .badge-section::after { content: ''; position: absolute; right: -16px; top: 0; width: 0; height: 0; border-top: 24px solid transparent; border-bottom: 24px solid transparent; border-left: 16px solid #C1272D; }
        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff4444; animation: pulse 1.2s ease-in-out infinite; box-shadow: 0 0 6px rgba(255,68,68,0.7); flex-shrink: 0; }
        .badge-text { font-size: 16px; font-weight: 600; letter-spacing: 0.5px; direction: rtl; }
        .badge-divider { opacity: 0.5; font-size: 14px; }
        .badge-sub { font-size: 10px; font-weight: 600; letter-spacing: 2px; opacity: 0.9; }
        .scroll-section { flex: 1; overflow: hidden; display: flex; align-items: center; background: #0f0f1a; padding-left: 24px; }
        .scroll-inner { display: flex; white-space: nowrap; will-change: transform; }
        .news-item { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 400; flex-shrink: 0; letter-spacing: 0.2px; }
        .news-diamond { color: #C1272D; font-size: 9px; flex-shrink: 0; }
        .chyron-bottom { display: flex; align-items: center; justify-content: space-between; height: 28px; padding: 0 14px; background: #080810; color: rgba(255,255,255,0.5); font-size: 11px; border-top: 1px solid rgba(255,255,255,0.04); }
        .bottom-left { display: flex; align-items: center; gap: 10px; }
        .bottom-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75); direction: rtl; }
        .bottom-sep { color: #C1272D; font-size: 11px; }
        .bottom-app { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; color: rgba(255,255,255,0.4); }
        .bottom-time { font-variant-numeric: tabular-nums; font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 0.5px; }
        @media (max-width: 640px) {
          .chyron-top { height: 42px; }
          .logo-section { width: 44px; padding: 0 4px; }
          .badge-text { font-size: 14px; }
          .badge-sub { display: none; }
          .badge-divider { display: none; }
          .news-item { font-size: 12px; }
          .badge-section::after { border-top-width: 21px; border-bottom-width: 21px; }
        }
      `}</style>
    </div>
  );
}
