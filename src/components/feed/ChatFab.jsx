import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import MessageInputBar from './MessageInputBar';

export default function ChatFab({ onMessage, activeDealId }) {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);
  const fabRef = useRef(null);

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
          <div className="chat-fab-popup-body">
            <div className="chat-fab-welcome">
              <div className="chat-fab-welcome-icon">
                <MessageCircle size={28} />
              </div>
              <div className="chat-fab-welcome-title">Hey, what can I help you find?</div>
              <div className="chat-fab-welcome-sub">Ask about a deal, market, or buy box.</div>
            </div>
            <MessageInputBar onMessage={onMessage} activeDealId={activeDealId} />
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
