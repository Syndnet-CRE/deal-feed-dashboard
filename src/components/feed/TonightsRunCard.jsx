import { Zap } from 'lucide-react';
import { useDeals } from '../../contexts/DealsContext';

export default function TonightsRunCard({ kpis }) {
  const { buyBoxes } = useDeals();
  const activeBoxes = buyBoxes.filter(b =>
    ['active', 'Active'].includes(b.status)
  );

  const markets = [...new Set(
    activeBoxes.flatMap(b => b.geo_states || b.geo_cities || []).slice(0, 3)
  )];

  const lastNightCount = kpis?.last_night_count ?? kpis?.new_this_week ?? 0;

  return (
    <div className="tonights-run-card">
      <div className="tonights-run-icon">
        <Zap size={16} />
      </div>
      <div className="tonights-run-body">
        <span className="tonights-run-label">Tonight&apos;s run is scheduled for 2:00am.</span>
        {activeBoxes.length > 0 && (
          <span className="tonights-run-detail">
            {activeBoxes.length} active {activeBoxes.length === 1 ? 'box' : 'boxes'}
            {markets.length > 0 && ` · Scanning ${markets.join(', ')}`}.
          </span>
        )}
        {lastNightCount > 0 && (
          <span className="tonights-run-last">Last night: {lastNightCount} deals matched.</span>
        )}
      </div>
    </div>
  );
}
