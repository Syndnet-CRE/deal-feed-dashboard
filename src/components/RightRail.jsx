import { useMemo } from 'react';
import { Star, ThumbsUp, MessageCircle, Eye } from 'lucide-react';
import { useDeals } from '../contexts/DealsContext';
import { DealMap } from './DealMap';
import { MarketNewsfeed } from './MarketNewsfeed';

function BuyBoxHealthCard({ box }) {
  const statusColor = {
    active: 'var(--nightdrop-green-700)',
    Active: 'var(--nightdrop-green-700)',
    paused: 'var(--warning)',
    Paused: 'var(--warning)',
    pending: 'var(--info)',
    Pending: 'var(--info)',
    'coverage failed': 'var(--danger)',
    'Coverage Failed': 'var(--danger)',
  };

  return (
    <div className="right-rail-bb-card">
      <div className="right-rail-bb-name">{box.label}</div>
      <div className="right-rail-bb-status" style={{ color: statusColor[box.status] || 'var(--space)' }}>
        {box.status}
      </div>
      {box.deal_count != null && (
        <div className="right-rail-bb-count">{box.deal_count} deals last night</div>
      )}
    </div>
  );
}

function relativeTime(date) {
  if (!date) return '';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function RecentActivityCard({ deals }) {
  const activity = useMemo(() => {
    const out = [];
    for (const d of deals || []) {
      if (d.saved && d.saved_at) out.push({ kind: 'saved', deal: d, when: d.saved_at });
      if (d.feedback === 'hot' && d.feedback_at) out.push({ kind: 'hot', deal: d, when: d.feedback_at });
      if (d.is_read && d.read_at) out.push({ kind: 'read', deal: d, when: d.read_at });
    }
    out.sort((a, b) => new Date(b.when) - new Date(a.when));
    return out.slice(0, 8);
  }, [deals]);

  const ICONS = {
    saved: <Star size={12} />,
    hot:   <ThumbsUp size={12} />,
    read:  <Eye size={12} />,
    chat:  <MessageCircle size={12} />,
  };

  const VERBS = {
    saved: 'Saved',
    hot:   'Marked hot',
    read:  'Viewed',
    chat:  'Discussed',
  };

  return (
    <div className="right-rail-section">
      <div className="right-rail-section-label">Recent Activity</div>
      {activity.length === 0 ? (
        <div className="right-rail-empty">
          Save, react to, or open a deal — your activity will show up here.
        </div>
      ) : (
        <ul className="right-rail-activity-list">
          {activity.map((a, i) => (
            <li key={i} className={`right-rail-activity-item kind-${a.kind}`}>
              <span className="right-rail-activity-icon">{ICONS[a.kind]}</span>
              <div className="right-rail-activity-body">
                <div className="right-rail-activity-line">
                  <span className="right-rail-activity-verb">{VERBS[a.kind]}</span>{' '}
                  <span className="right-rail-activity-target">
                    {a.deal.addr || a.deal.address || 'a deal'}
                  </span>
                </div>
                <div className="right-rail-activity-time">{relativeTime(a.when)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RightRail({ deals, selectedDealId, onSelectDeal }) {
  const { buyBoxes } = useDeals();

  return (
    <aside className="right-rail-floating">
      {/* Card 1: Mini map */}
      <div className="rail-card rail-card-map">
        <DealMap
          deals={deals}
          selectedId={selectedDealId}
          onClickDeal={onSelectDeal}
          withPopup={false}
        />
      </div>

      {/* Card 2: Buy Box Health + Recent Activity, independent scroll */}
      <div className="rail-card rail-card-stack">
        <div className="rail-card-scroll">
          <div className="right-rail-section">
            <div className="right-rail-section-label">Buy Box Health</div>
            {buyBoxes.length === 0 ? (
              <div className="right-rail-empty">No active buy boxes</div>
            ) : (
              buyBoxes.map(bb => <BuyBoxHealthCard key={bb.id} box={bb} />)
            )}
          </div>

          <RecentActivityCard deals={deals} />

          <div className="right-rail-section right-rail-pulse">
            <MarketNewsfeed />
          </div>
        </div>
      </div>
    </aside>
  );
}
