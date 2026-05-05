import pulseData from '../data/marketPulse.json';

function relTime(isoStr) {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MarketNewsfeed() {
  return (
    <div className="mnf-panel">
      <div className="mnf-head">
        <div>
          <div className="mnf-title">
            <span className="mnf-live-dot" />
            Market Pulse
          </div>
          <div className="mnf-sub">Run updates &amp; market signals</div>
        </div>
      </div>
      <div className="mnf-feed">
        {pulseData.map(item => (
          <div key={item.id} className="mnf-item">
            <div className="mnf-row">
              <span className={`mnf-tag ${item.tag}`}>{item.tag}</span>
              <span className="mnf-time">{relTime(item.timestamp)}</span>
            </div>
            <div className="mnf-body-title">{item.title}</div>
            <div className="mnf-body-text">{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
