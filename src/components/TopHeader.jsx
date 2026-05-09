import { Search } from 'lucide-react';

export default function TopHeader({ searchQuery, onSearchChange }) {
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
    </header>
  );
}
