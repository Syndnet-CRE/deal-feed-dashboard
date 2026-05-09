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

export default function RightRail({ deals, selectedDealId, onSelectDeal }) {
  const { buyBoxes } = useDeals();

  return (
    <aside className="right-rail">
      <div className="right-rail-map-wrap">
        <DealMap
          deals={deals}
          selectedId={selectedDealId}
          onClickDeal={onSelectDeal}
          withPopup={false}
        />
      </div>

      <div className="right-rail-section">
        <div className="right-rail-section-label">Buy Box Health</div>
        {buyBoxes.length === 0 ? (
          <div className="right-rail-empty">No active buy boxes</div>
        ) : (
          buyBoxes.map(bb => <BuyBoxHealthCard key={bb.id} box={bb} />)
        )}
      </div>

      <div className="right-rail-section right-rail-pulse">
        <MarketNewsfeed />
      </div>
    </aside>
  );
}
