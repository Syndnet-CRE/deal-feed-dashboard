import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { PipelineTimeline } from './PipelineTimeline';

function getStoredTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export default function TopHeader() {
  const [theme, setTheme] = useState(getStoredTheme);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('nightdrop-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <header className="top-header">
      <div className="top-header-left">
        <div className="top-header-wordmark">
          <span className="top-header-logo-dot" />
          Nightdrop.ai
        </div>
      </div>

      <div className="top-header-center">
        <PipelineTimeline mode="track" showLabels showPhase={false} />
      </div>

      <div className="top-header-right">
        <PipelineTimeline mode="countdown" size="header" />
        <button
          className="top-header-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
