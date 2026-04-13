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
  const supabase = createClient();

  useEffect(() => { fetchMessages(); }, []);

  async function fetchMessages() {
    const { data } = await supabase
      .from('news_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
  }

  async function addMessage() {
    if (!newMessage.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('news_messages').insert({ message: newMessage.trim(), active: true });
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

  return (
    <div className="admin-news">
      <h3 className="admin-news-title">📰 News Ticker — الأخبار</h3>
      <p className="admin-news-desc">Messages scroll across the top of the app. Go unhinged. If no messages are active, funny defaults are shown.</p>

      <div className="admin-news-input-row">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addMessage()}
          placeholder='e.g. "BREAKING: Kevin has not pulled a Legendary in 72 hours. Wellness check requested."'
          className="admin-news-input"
          maxLength={280}
        />
        <button onClick={addMessage} disabled={loading || !newMessage.trim()} className="admin-news-add-btn">
          {loading ? '...' : '+ Add'}
        </button>
      </div>

      <div className="admin-news-list">
        {messages.length === 0 && <p className="admin-news-empty">No messages yet. Defaults will show until you add some.</p>}
        {messages.map((msg) => (
          <div key={msg.id} className={`admin-news-item ${!msg.active ? 'inactive' : ''}`}>
            <div className="admin-news-item-text">
              <span className="admin-news-item-diamond">&#x25C6;</span>
              {msg.message}
            </div>
            <div className="admin-news-item-actions">
              <button onClick={() => toggleMessage(msg.id, msg.active)} className={`admin-news-toggle ${msg.active ? 'on' : 'off'}`}>
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
        .admin-news-desc { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0 0 16px; }
        .admin-news-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .admin-news-input { flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #fff; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .admin-news-input:focus { border-color: #C1272D; }
        .admin-news-input::placeholder { color: rgba(255,255,255,0.2); }
        .admin-news-add-btn { padding: 10px 20px; background: #C1272D; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; }
        .admin-news-add-btn:hover { opacity: 0.85; }
        .admin-news-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
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
