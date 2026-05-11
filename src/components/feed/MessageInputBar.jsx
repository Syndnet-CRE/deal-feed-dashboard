import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { api } from '../../lib/api';

export default function MessageInputBar({ onMessage, activeDealId }) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    setValue('');
    try {
      const data = await api.post('/api/dealfeed/agent/message', {
        content: text,
        deal_id: activeDealId || null,
      });
      onMessage?.({ role: 'user', content: text, message_type: 'chat', created_at: new Date().toISOString() });
      if (data?.reply) {
        onMessage?.({ role: 'agent', content: data.reply, message_type: 'chat', created_at: new Date().toISOString() });
      }
    } catch {
      setValue(text);
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
    <form className="message-input-bar" onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        className="message-input-textarea"
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
        className="message-input-send"
        disabled={!value.trim() || sending}
        aria-label="Send"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
