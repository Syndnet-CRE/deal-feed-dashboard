import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

function useCountdown() {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    function computeSecs() {
      const now = new Date();
      const next2am = new Date(now);
      next2am.setHours(2, 0, 0, 0);
      if (next2am <= now) next2am.setDate(next2am.getDate() + 1);
      return Math.max(0, Math.floor((next2am - now) / 1000));
    }
    setSecs(computeSecs());
    const id = setInterval(() => setSecs(computeSecs()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TopHeader({ searchQuery, onSearchChange }) {
  const countdown = useCountdown();

  return (
    <header className="top-header">
      <div className="top-header-wordmark">
        <span className="top-header-logo-dot" />
        Nightdrop.ai
      </div>

      <div className="top-header-search">
        <Search size={14} className="top-header-search-icon" />
        <input
          className="top-header-search-input"
          type="text"
          placeholder="Search deals by address or asset class"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="top-header-countdown">
        <span className="top-header-countdown-label">Next run</span>
        <span className="top-header-countdown-clock">{countdown}</span>
      </div>
    </header>
  );
}
