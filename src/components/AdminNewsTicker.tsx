'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface NewsMessage {
  id: string;
  message: string;
  active: boolean;
  created_at: string;
}

export default function AdminNewsTicker() {
  const [messages, setMessages] = useState<NewsMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Ticker display settings
  const [configId, setConfigId]     = useState<string | null>(null);
  const [speed, setSpeed]           = useState(80);    // px/sec
  const [spacing, setSpacing]       = useState(32);    // px padding per side
  const [savingCfg, setSavingCfg]   = useState(false);
  const [cfgMsg, setCfgMsg]         = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    fetchConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMessages() {
    const { data } = await supabase
      .from('news_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
  }

  async function fetchConfig() {
    const { data } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('gacha_config').select('id, ticker_speed, ticker_spacing' as any).single();
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cfg = data as any;
      setConfigId(cfg.id);
      setSpeed(cfg.ticker_speed  ?? 80);
      setSpacing(cfg.ticker_spacing ?? 32);
    }
  }

  async function saveConfig() {
    if (!configId) return;
    setSavingCfg(true);
    setCfgMsg('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('gacha_config') as any)
      .update({ ticker_speed: speed, ticker_spacing: spacing })
      .eq('id', configId);
    setSavingCfg(false);
    setCfgMsg(error ? `Error: ${error.message}` : 'Saved!');
    setTimeout(() => setCfgMsg(''), 2500);
  }

  async function addMessage() {
    if (!newMessage.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from('news_messages')
      .insert({ message: newMessage.trim(), active: true });
    if (!error) { setNewMessage(''); await fetchMessages(); }
    setLoading(false);
  }

  async function toggleMessage(id: string, active: boolean) {
    await supabase.from('news_messages').update({ active: !active }).eq('id', id);
    await fetchMessages();
  }

  async function deleteMessage(id: string) {
    await supabase.from('news_messages').delete().eq('id', id);
    await fetchMessages();
  }

  async function purgeAll() {
    if (!confirm('Delete ALL news messages? This cannot be undone.')) return;
    setLoading(true);
    // "not id is null" = all rows; satisfies RLS requirement of having a filter
    await supabase.from('news_messages').delete().not('id', 'is', null);
    await fetchMessages();
    setLoading(false);
  }

  return (
    <div className="admin-news">
      <h3 className="admin-news-title">📰 News Ticker — الأخبار</h3>
      <p className="admin-news-desc">
        Messages scroll across the bottom of the app. Go unhinged. If no messages are active, funny defaults are shown.
      </p>

      {/* ── Display settings ───────────────────────────────────────── */}
      <div className="cfg-row">
        <div className="cfg-field">
          <label className="cfg-label">Speed (px/sec)</label>
          <input
            type="number"
            min="10"
            max="400"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="cfg-input"
          />
          <span className="cfg-hint">default 80 · higher = faster</span>
        </div>
        <div className="cfg-field">
          <label className="cfg-label">Item spacing (px per side)</label>
          <input
            type="number"
            min="4"
            max="200"
            value={spacing}
            onChange={e => setSpacing(Number(e.target.value))}
            className="cfg-input"
          />
          <span className="cfg-hint">default 32 · gap between items</span>
        </div>
        <div className="cfg-save-col">
          <button onClick={saveConfig} disabled={savingCfg} className="cfg-save-btn">
            {savingCfg ? '...' : 'Save'}
          </button>
          {cfgMsg && <span className="cfg-feedback">{cfgMsg}</span>}
        </div>
      </div>

      {/* ── Add message ────────────────────────────────────────────── */}
      <div className="admin-news-input-row">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addMessage()}
          placeholder='e.g. "BREAKING: Kevin has not pulled a Legendary in 72 hours."'
          className="admin-news-input"
          maxLength={280}
        />
        <button
          onClick={addMessage}
          disabled={loading || !newMessage.trim()}
          className="admin-news-add-btn"
        >
          {loading ? '...' : '+ Add'}
        </button>
      </div>

      {/* ── Message list + purge ───────────────────────────────────── */}
      <div className="list-header">
        <span className="list-count">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
        {messages.length > 0 && (
          <button onClick={purgeAll} disabled={loading} className="purge-btn">
            🗑 Purge All
          </button>
        )}
      </div>

      <div className="admin-news-list">
        {messages.length === 0 && (
          <p className="admin-news-empty">No messages yet. Defaults will show until you add some.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`admin-news-item ${!msg.active ? 'inactive' : ''}`}>
            <div className="admin-news-item-text">
              <span className="admin-news-item-diamond">&#x25C6;</span>
              {msg.message}
            </div>
            <div className="admin-news-item-actions">
              <button
                onClick={() => toggleMessage(msg.id, msg.active)}
                className={`admin-news-toggle ${msg.active ? 'on' : 'off'}`}
              >
                {msg.active ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => deleteMessage(msg.id)} className="admin-news-delete">✕</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .admin-news { padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
        .admin-news-title { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 4px; }
        .admin-news-desc { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0 0 14px; }

        /* Config row */
        .cfg-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; }
        .cfg-field { display: flex; flex-direction: column; gap: 4px; }
        .cfg-label { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .cfg-input { width: 100px; padding: 6px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 13px; outline: none; }
        .cfg-input:focus { border-color: #C1272D; }
        .cfg-hint { font-size: 10px; color: rgba(255,255,255,0.2); }
        .cfg-save-col { display: flex; flex-direction: column; gap: 4px; }
        .cfg-save-btn { padding: 7px 18px; background: rgba(193,39,45,0.8); color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .cfg-save-btn:hover { background: #C1272D; }
        .cfg-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cfg-feedback { font-size: 11px; color: rgba(100,220,100,0.8); }

        /* Add message row */
        .admin-news-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .admin-news-input { flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #fff; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .admin-news-input:focus { border-color: #C1272D; }
        .admin-news-input::placeholder { color: rgba(255,255,255,0.2); }
        .admin-news-add-btn { padding: 10px 20px; background: #C1272D; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; }
        .admin-news-add-btn:hover { opacity: 0.85; }
        .admin-news-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* List header */
        .list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .list-count { font-size: 11px; color: rgba(255,255,255,0.3); }
        .purge-btn { padding: 4px 12px; background: rgba(193,39,45,0.12); border: 1px solid rgba(193,39,45,0.25); color: rgba(193,39,45,0.8); border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .purge-btn:hover { background: rgba(193,39,45,0.25); color: #C1272D; }
        .purge-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Message list */
        .admin-news-list { display: flex; flex-direction: column; gap: 6px; }
        .admin-news-empty { font-size: 13px; color: rgba(255,255,255,0.25); text-align: center; padding: 20px; }
        .admin-news-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; transition: opacity 0.2s; }
        .admin-news-item.inactive { opacity: 0.35; }
        .admin-news-item-text { flex: 1; font-size: 13px; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .admin-news-item-diamond { color: #C1272D; font-size: 8px; flex-shrink: 0; }
        .admin-news-item-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .admin-news-toggle { padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; cursor: pointer; border: 1px solid; transition: all 0.2s; }
        .admin-news-toggle.on { background: rgba(45,158,45,0.15); border-color: rgba(45,158,45,0.3); color: #2d9e2d; }
        .admin-news-toggle.off { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); }
        .admin-news-delete { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: rgba(255,255,255,0.25); font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .admin-news-delete:hover { background: rgba(193,39,45,0.15); border-color: rgba(193,39,45,0.3); color: #C1272D; }
      `}</style>
    </div>
  );
}
