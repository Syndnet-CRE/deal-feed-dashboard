import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

function fmtTs(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function DealChatThread({ dealId, dealAddress, autoFocus }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [value, setValue]       = useState('');
  const [sending, setSending]   = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/dealfeed/agent/messages?limit=200');
        if (cancelled) return;
        const all = data?.messages || [];
        const scoped = all.filter(m => String(m.deal_id || '') === String(dealId));
        setMessages(scoped);
      } catch (_) {
        // silent — fresh thread is fine for MVP
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dealId]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    setValue('');
    const userMsg = { id: 'tmp-u-' + Date.now(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const data = await api.post('/api/dealfeed/agent/message', { content: text, deal_id: dealId });
      if (data?.reply) {
        setMessages(prev => [...prev, {
          id: 'tmp-a-' + Date.now(),
          role: 'agent',
          content: data.reply,
          created_at: new Date().toISOString(),
        }]);
      }
    } catch (_) {
      setValue(text);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="deal-chat-thread">
      <div className="deal-chat-header">
        <span className="deal-chat-title">Discuss this deal</span>
        <span className="deal-chat-sub">{dealAddress}</span>
      </div>

      <div className="deal-chat-messages" ref={scrollRef}>
        {loading ? (
          <div className="deal-chat-loading"><Loader2 size={14} className="spin" /> Loading thread…</div>
        ) : messages.length === 0 ? (
          <div className="deal-chat-empty">
            Ask the Nightdrop agent anything about this deal — owner, comps, distress signals, market context.
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`deal-chat-msg ${msg.role}`}>
              <div className="deal-chat-msg-bubble">
                {msg.role === 'agent' && <span className="deal-chat-msg-avatar">N</span>}
                <div className="deal-chat-msg-body">
                  <div className="deal-chat-msg-text">{msg.content}</div>
                  <div className="deal-chat-msg-ts">{fmtTs(msg.created_at)}</div>
                </div>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="deal-chat-msg agent">
            <div className="deal-chat-msg-bubble">
              <span className="deal-chat-msg-avatar">N</span>
              <div className="deal-chat-msg-body">
                <div className="deal-chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form className="deal-chat-input-row" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="deal-chat-input"
          placeholder="Ask about this deal…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          maxLength={2000}
          disabled={sending}
        />
        <button
          type="submit"
          className="deal-chat-send"
          disabled={!value.trim() || sending}
          aria-label="Send"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
