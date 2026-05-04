import { AerialThumb } from './AerialThumb';
import { I } from './Icons';
import { fmtMoney, scoreClass } from '../lib/format';

export function ScoreBubble({ score, size = "md" }) {
  return (
    <div className={`score-bubble ${scoreClass(score)}`} style={size === "sm" ? { width: 30, height: 30, fontSize: 12 } : size === "lg" ? { width: 56, height: 56, fontSize: 20, borderWidth: 2 } : null}>
      {score}
    </div>
  );
}

export function FactRow({ deal }) {
  return (
    <div className="deal-row">
      <span className="tag">{deal.asset}</span>
      <span className="fact"><span className="k">Lot</span> <span className="v">{deal.acres.toFixed(2)} ac</span></span>
      <span className="dot-sep">•</span>
      <span className="fact"><span className="k">Assessed</span> <span className="v">{fmtMoney(deal.value)}</span></span>
      <span className="dot-sep">•</span>
      <span className="fact"><span className="k">Box</span> <span className="v">{deal.box}</span></span>
    </div>
  );
}

export function DealCard({ deal, onClick, selected }) {
  return (
    <div className={`deal-card ${selected ? "selected" : ""}`} onClick={onClick} role="button" tabIndex={0}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <div className="deal-addr" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {deal.addr}
              {deal.notes && <I.Doc size={11} style={{ marginLeft: 5, color: "var(--ink-4)", verticalAlign: "middle", flexShrink: 0 }} title="Has notes"/>}
            </div>
            <div className="deal-loc">{deal.city}</div>
          </div>
          <ScoreBubble score={deal.score} size="sm"/>
        </div>
        <FactRow deal={deal}/>
      </div>
      <div className="deal-thumb"><AerialThumb id={deal.id} lat={deal.lat} lng={deal.lng}/></div>
    </div>
  );
}

export function MapPinSVG({ score, num, selected }) {
  const cls = scoreClass(score);
  const fill = cls === "hi" ? "#1DAF29" : cls === "md" ? "#F4B73E" : "#9DA2B3";
  const stroke = "#06270A";
  return (
    <svg width="26" height="32" viewBox="0 0 26 32" style={{ filter: `drop-shadow(0 ${selected ? 4 : 2}px ${selected ? 8 : 4}px rgba(0,0,0,0.55))` }}>
      <path d="M13 0 C 5.8 0 0 5.5 0 12.5 C 0 22 13 32 13 32 S 26 22 26 12.5 C 26 5.5 20.2 0 13 0 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"/>
      <circle cx="13" cy="12" r="6.5" fill={stroke}/>
      <text x="13" y="15.5" textAnchor="middle" fontFamily="Manrope" fontSize="9" fontWeight="800" fill={fill}>{num != null ? num : ""}</text>
    </svg>
  );
}

export function MapPin({ deal, x, y, num, selected, onClick }) {
  return (
    <div className={`map-pin numbered ${selected ? "selected" : ""}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(deal); }}>
      <MapPinSVG score={deal.score} num={num} selected={selected} asset={deal.asset}/>
    </div>
  );
}

export function ClusterPin({ count, x, y }) {
  return (
    <div className="map-pin cluster" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
      <div className="pin-circle">{count}</div>
    </div>
  );
}
