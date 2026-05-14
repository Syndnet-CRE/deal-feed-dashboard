import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../lib/api';

function fmtTs(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function ChatFab({ activeDealId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const popupRef = useRef(null);
  const fabRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const historyLoaded = useRef(false);

  useEffect(() => {
    if (!open || historyLoaded.current) return;
    historyLoaded.current = true;
    setLoadingHistory(true);
    api.get('/api/dealfeed/agent/messages?limit=50')
      .then(data => {
        const msgs = (data?.messages || []).filter(m => !m.deal_id);
        setMessages(msgs);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (popupRef.current?.contains(e.target)) return;
      if (fabRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    setValue('');
    const userMsg = { id: 'tmp-u-' + Date.now(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const data = await api.post('/api/dealfeed/agent/message', {
        content: text,
        deal_id: activeDealId || null,
      });
      if (data?.reply) {
        setMessages(prev => [...prev, {
          id: 'tmp-a-' + Date.now(),
          role: 'agent',
          content: data.reply,
          created_at: new Date().toISOString(),
        }]);
      }
    } catch {
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
    <>
      {open && (
        <div className="chat-fab-popup" ref={popupRef}>
          <div className="chat-fab-popup-header">
            <span className="chat-fab-popup-title">Ask Nightdrop</span>
            <button
              className="chat-fab-popup-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X size={14} />
            </button>
          </div>

          <div className="chat-fab-thread-body">
            <div className="chat-fab-thread-messages" ref={scrollRef}>
              {loadingHistory ? (
                <div className="chat-fab-thread-status">Loading…</div>
              ) : messages.length === 0 ? (
                <div className="chat-fab-welcome">
                  <div className="chat-fab-welcome-icon">
                    <MessageCircle size={28} />
                  </div>
                  <div className="chat-fab-welcome-title">Hey, what can I help you find?</div>
                  <div className="chat-fab-welcome-sub">Ask about a deal, market, or buy box.</div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={msg.id || i} className={`chat-fab-thread-msg ${msg.role}`}>
                    {msg.role === 'agent' && (
                      <span className="chat-fab-thread-avatar">N</span>
                    )}
                    <div className="chat-fab-thread-msg-body">
                      <div className="chat-fab-thread-msg-text"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                      <div className="chat-fab-thread-msg-ts">{fmtTs(msg.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div className="chat-fab-thread-msg agent">
                  <span className="chat-fab-thread-avatar">N</span>
                  <div className="chat-fab-thread-msg-body">
                    <div className="chat-fab-thread-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="chat-fab-thread-input-row" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="chat-fab-thread-textarea"
                placeholder="Ask Nightdrop about a deal, market, or buy box…"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                maxLength={2000}
                disabled={sending}
              />
              <button
                type="submit"
                className="chat-fab-thread-send"
                disabled={!value.trim() || sending}
                aria-label="Send"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        ref={fabRef}
        className={`chat-fab${open ? ' chat-fab-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <X size={16} /> : <MessageCircle size={16} />}
      </button>
    </>
  );
}
