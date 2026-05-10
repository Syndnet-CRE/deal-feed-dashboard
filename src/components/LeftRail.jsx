import { Inbox, Mail, Star, Flame } from 'lucide-react';
import TonightsRunCard from './feed/TonightsRunCard';
import { MarketNewsfeed } from './MarketNewsfeed';
import { PipelineTimeline } from './PipelineTimeline';

const FILTERS = [
  { id: 'all',    label: 'All',    Icon: Inbox },
  { id: 'unread', label: 'Unread', Icon: Mail },
  { id: 'saved',  label: 'Saved',  Icon: Star },
  { id: 'hot',    label: 'Hot',    Icon: Flame },
];

export default function LeftRail({ filter, setFilter, counts, kpis }) {
  return (
    <aside className="left-rail-floating">
      <div className="rail-card left-rail-nextrun-card">
        <PipelineTimeline mode="countdown" />
      </div>

      <div className="rail-card left-rail-filter-card">
        <div className="left-rail-section-label">Filter</div>
        <div className="left-rail-filter-chips">
          {FILTERS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`feed-filter-chip${filter === id ? ' active' : ''}`}
              onClick={() => setFilter(id)}
            >
              <Icon size={13} />
              <span>{label}</span>
              <span className="feed-filter-chip-count">{counts?.[id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rail-card left-rail-run-card">
        <TonightsRunCard kpis={kpis} />
      </div>

      <div className="rail-card left-rail-pulse-card">
        <MarketNewsfeed />
      </div>
    </aside>
  );
}
