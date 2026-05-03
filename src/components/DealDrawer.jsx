import { useState } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { I } from './Icons';
import { AerialThumb } from './AerialThumb';
import { ScoreBubble, MapPinSVG } from './DealComponents';
import { fmtMoney, fmt, hasVal } from '../lib/format';

function SignalPill({ label, intent = "gray" }) {
  return <span className={`pill ${intent}`}><span className="pip"/>{label}</span>;
}

const SIGNAL_INTENT = {
  "Absentee Owner": "amber",
  "Out-of-State Owner": "amber",
  "No Permits 5yr": "blue",
  "Entity Owner": "gray",
  "Opportunity Zone": "green",
};

function Confidence({ pct }) {
  return (
    <span className="confidence" title={`${pct}% confidence`}>
      <span className="conf-bar"><span className="conf-fill" style={{ width: `${pct}%` }}/></span>
      <span style={{ color: pct >= 75 ? "#5BCC48" : pct >= 60 ? "#F4B73E" : "#9DA2B3" }}>{pct}%</span>
    </span>
  );
}

function CompsMap({ deal }) {
  const subjX = 50, subjY = 55;
  const compPos = [{ x: 28, y: 38 }, { x: 62, y: 28 }, { x: 72, y: 60 }, { x: 36, y: 72 }];
  return (
    <div className="comps-map">
      <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
        <rect width="200" height="100" fill="#0E1014"/>
        <pattern id="cpg" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" stroke="#1A1B22" strokeWidth="0.4" fill="none"/>
        </pattern>
        <rect width="200" height="100" fill="url(#cpg)"/>
        <path d="M -10 50 C 60 40, 120 70, 220 55" stroke="#2c2f38" strokeWidth="2.5" fill="none"/>
        <path d="M 80 -10 C 90 40, 100 70, 110 110" stroke="#2c2f38" strokeWidth="2" fill="none"/>
      </svg>
      {compPos.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -100%)" }}>
          <svg width="18" height="22" viewBox="0 0 26 32"><path d="M13 0 C 5.8 0 0 5.5 0 12.5 C 0 22 13 32 13 32 S 26 22 26 12.5 C 26 5.5 20.2 0 13 0 Z" fill="#40424D" stroke="#1A1B22" strokeWidth="1.5"/><circle cx="13" cy="12" r="4" fill="#1A1B22"/></svg>
        </div>
      ))}
      <div style={{ position: "absolute", left: `${subjX}%`, top: `${subjY}%`, transform: "translate(-50%, -100%)" }}>
        <MapPinSVG score={deal.score} num={null} selected={true}/>
      </div>
      <div style={{ position: "absolute", left: 10, top: 10, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9DA2B3", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: 4, border: "1px solid #40424D" }}>
        Subject + 4 Comps · 3.6 mi radius
      </div>
    </div>
  );
}

export function DealDrawer({ deal, onClose }) {
  const { postFeedback } = useDeals();
  const [feedback, setFeedback] = useState(deal?.fb || null);
  if (!deal) return null;

  const brief = deal.briefJson || {};
  const yearsHeld = brief.years_held ?? brief.yearsHeld ?? "—";
  const zoning = brief.zoning ?? "—";
  const floodZone = brief.flood_zone ?? brief.floodZone ?? "—";
  const sewer = brief.sewer ?? brief.sewer_status ?? "—";
  const lastSale = brief.last_sale_date && brief.last_sale_price
    ? `${brief.last_sale_date} · ${fmtMoney(brief.last_sale_price)}`
    : (brief.lastSale ?? "—");
  const landValue = brief.land_value ?? brief.landValue ?? Math.round((deal.value || 0) * 0.62);
  const improvementValue = brief.improvement_value ?? brief.improvementValue ?? Math.round((deal.value || 0) * 0.18);

  const handleFeedback = (fb) => {
    const next = feedback === fb ? null : fb;
    setFeedback(next);
    postFeedback(deal.id, next);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer" role="dialog" aria-label="Deal detail">
        <div className="drawer-head">
          <button className="drawer-close" onClick={onClose} aria-label="Close"><I.Close size={14}/></button>
          <div className="drawer-headline">
            <h2>{deal.addr}</h2>
            <div className="drawer-sub">{fmt(deal.city)} · FIPS {fmt(deal.fips)} · Delivered {deal.days === 0 ? "today" : `${deal.days} day${deal.days > 1 ? "s" : ""} ago`}</div>
          </div>
          <ScoreBubble score={deal.score} size="lg"/>
        </div>

        <div className="aerial">
          <AerialThumb id={"big-" + deal.id} large={true}/>
          <div className="aerial-tag"><I.Layers size={11}/> Aerial · GIS Verified</div>
          <div className="aerial-scale"><span className="bar"/>200 ft</div>
        </div>

        <div className="signal-row">
          {(deal.signals || []).map((s) => <SignalPill key={s} label={s} intent={SIGNAL_INTENT[s] || "gray"}/>)}
          {deal.score >= 80 && <SignalPill label={`Top ${100 - deal.score + 5}% Distress`} intent="green"/>}
        </div>

        <div className="three-col">
          <div className="col">
            <div className="col-title"><I.Building size={11}/> Property Facts</div>
            <div className="kv-list">
              <div className="kv"><span className="k">Lot Size</span><span className="v">{deal.acres ? `${deal.acres.toFixed(2)} ac` : "—"}</span></div>
              <div className="kv"><span className="k">GIS Verified</span><span className="v">{deal.gisAcres ? `${deal.gisAcres.toFixed(2)} ac` : "—"}</span></div>
              <div className="kv"><span className="k">Property Use</span><span className="v">{fmt(deal.asset)}</span></div>
              <div className="kv"><span className="k">Zoning</span><span className="v">{zoning}</span></div>
              <div className="kv"><span className="k">Last Sale</span><span className="v">{lastSale}</span></div>
              <div className="kv"><span className="k">Years Held</span><span className="v">{yearsHeld === "—" ? "—" : `${yearsHeld} yr`}</span></div>
            </div>
          </div>
          <div className="col">
            <div className="col-title"><I.Doc size={11}/> Assessed Value & GIS</div>
            <div className="kv-list">
              <div className="kv"><span className="k">Land Value</span><span className="v">{fmtMoney(landValue)}</span></div>
              <div className="kv"><span className="k">Improvement</span><span className="v">{fmtMoney(improvementValue)}</span></div>
              <div className="kv"><span className="k">Total Assessed</span><span className="v" style={{ color: "#5BCC48" }}>{fmtMoney(deal.value)}</span></div>
              <div className="kv"><span className="k">Land : Imp Ratio</span><span className="v">{improvementValue > 0 ? `${(landValue / improvementValue).toFixed(1)}x` : "—"}</span></div>
              <div className="kv"><span className="k">Flood Zone</span><span className="v">{floodZone}</span></div>
              <div className="kv"><span className="k">Opp Zone</span><span className="v" style={{ color: (deal.signals || []).includes("Opportunity Zone") ? "#5BCC48" : "#9DA2B3" }}>{(deal.signals || []).includes("Opportunity Zone") ? "Yes" : "No"}</span></div>
              <div className="kv"><span className="k">Sewer</span><span className="v">{sewer}</span></div>
            </div>
          </div>
          <div className="col">
            <div className="col-title"><I.Pin size={11}/> Owner & Skip Trace</div>
            <div className="entity-card">
              <div className="ent-name">{fmt(deal.owner)}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {hasVal(deal.entityType) && <span className="tag">{fmt(deal.entityType)}</span>}
                {deal.absentee && <span className="tag" style={{ background: "rgba(244,183,62,0.10)", color: "#F4B73E", borderColor: "rgba(244,183,62,0.4)" }}>Absentee</span>}
              </div>
              {hasVal(deal.mailing) && <div className="ent-line" style={{ marginTop: 8 }}>{fmt(deal.mailing)}</div>}
            </div>
            {deal.dm && (
              <div className="kv-list">
                <div className="dm-row"><span className="k">Decision Maker</span><span className="v">{fmt(deal.dm.name)} {deal.dm.conf != null && <Confidence pct={deal.dm.conf}/>}</span></div>
                {deal.dm.phone && <div className="dm-row"><span className="k"><I.Phone size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}/>Phone</span><span className="v" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5 }}>{deal.dm.phone} {deal.dm.phoneConf != null && <Confidence pct={deal.dm.phoneConf}/>}</span></div>}
                {deal.dm.email && <div className="dm-row"><span className="k"><I.Mail size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}/>Email</span><span className="v" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5 }}>{deal.dm.email} {deal.dm.emailConf != null && <Confidence pct={deal.dm.emailConf}/>}</span></div>}
              </div>
            )}
          </div>
        </div>

        {deal.narrative && (
          <div className="narrative">
            <div className="narrative-card">
              <h4><I.Sparkle size={11}/> Parcyl Data Analysis</h4>
              {deal.narrative.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </div>
        )}

        <div className="comps">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="col-title" style={{ marginBottom: 0 }}><I.Pin size={11}/> Comparable Sales</div>
            <span className="caption" style={{ color: "#9DA2B3", fontSize: 11 }}>{(deal.briefJson?.comps || []).length} comps</span>
          </div>
          <CompsMap deal={deal}/>
          <table className="comps-table">
            <thead><tr><th>Address</th><th>Type</th><th>Sale Date</th><th style={{ textAlign: "right" }}>Price</th><th style={{ textAlign: "right" }}>SF</th><th style={{ textAlign: "right" }}>Distance</th><th style={{ textAlign: "right" }}>Similarity</th></tr></thead>
            <tbody>
              {(deal.briefJson?.comps || []).length === 0
                ? <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px 0", color: "#9DA2B3" }}>No comparable sales in deal data.</td></tr>
                : (deal.briefJson.comps).map((c, i) => (
                  <tr key={i}>
                    <td className="addr">{c.addr}</td>
                    <td>{c.type}</td>
                    <td>{c.date}</td>
                    <td style={{ textAlign: "right", color: "#FFFFFF", fontWeight: 600 }}>{fmtMoney(c.price)}</td>
                    <td style={{ textAlign: "right" }}>{c.sf ? Number(c.sf).toLocaleString() : "—"}</td>
                    <td style={{ textAlign: "right" }}>{c.dist || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      {c.sim != null ? <span className="sim" style={{
                        background: c.sim >= 85 ? "rgba(29,175,41,0.14)" : c.sim >= 75 ? "rgba(244,183,62,0.13)" : "rgba(157,162,179,0.12)",
                        color: c.sim >= 85 ? "#5BCC48" : c.sim >= 75 ? "#F4B73E" : "#9DA2B3",
                        border: `1px solid ${c.sim >= 85 ? "rgba(29,175,41,0.4)" : c.sim >= 75 ? "rgba(244,183,62,0.4)" : "rgba(157,162,179,0.3)"}`
                      }}>{c.sim}</span> : "—"}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        <div className="drawer-actions">
          <button className={`btn ${feedback === "hot" ? "primary" : "outline-green"}`} onClick={() => handleFeedback("hot")}>
            <I.Hot size={14}/>{feedback === "hot" ? "Marked Hot" : "Mark as Hot"}
          </button>
          <button className={`btn ${feedback === "no" ? "danger" : ""}`} style={feedback === "no" ? { background: "rgba(229,72,77,0.10)", borderColor: "rgba(229,72,77,0.4)", color: "#FF7378" } : null} onClick={() => handleFeedback("no")}>
            <I.Close size={14}/>{feedback === "no" ? "Marked Not Relevant" : "Not Relevant"}
          </button>
          <button className="btn"><I.External size={13}/> Public Record</button>
        </div>
      </div>
    </>
  );
}
