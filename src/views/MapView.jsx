import { useState, useMemo } from 'react';
import { DEALS, BUY_BOXES } from '../data/mockData';
import { I } from '../components/Icons';
import { ScoreBubble, MapPin } from '../components/DealComponents';
import { MapBackground } from '../components/MapBackground';
import { fmtMoney } from '../lib/format';

export function MapView({ onOpenDeal }) {
  const [popup, setPopup] = useState(null);
  const [box, setBox] = useState("all");
  const [range, setRange] = useState("all");
  const [klass, setKlass] = useState("all");
  const [mapStyle, setMapStyle] = useState("dark");

  const filtered = useMemo(() => {
    let out = DEALS;
    if (box !== "all") out = out.filter(d => d.box === box);
    if (klass !== "all") out = out.filter(d => d.asset === klass);
    const days = range === "week" ? 7 : range === "month" ? 31 : 9999;
    out = out.filter(d => d.days <= days);
    return out;
  }, [box, range, klass]);

  return (
    <div className="map-wrap" style={{ height: "100%" }} onClick={() => setPopup(null)}>
      <MapBackground density={1.6} satellite={mapStyle === "sat"}/>

      <div className="map-filter-panel" onClick={(e) => e.stopPropagation()}>
        <h4>Filters · {filtered.length} pins</h4>
        <div>
          <span className="select-label">Buy Box</span>
          <select className="select" style={{ width: "100%", marginTop: 4 }} value={box} onChange={(e) => setBox(e.target.value)}>
            <option value="all">All Buy Boxes</option>
            {BUY_BOXES.filter(b => b.status === "Active").map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <span className="select-label">Date Range</span>
          <select className="select" style={{ width: "100%", marginTop: 4 }} value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div>
          <span className="select-label">Asset Class</span>
          <select className="select" style={{ width: "100%", marginTop: 4 }} value={klass} onChange={(e) => setKlass(e.target.value)}>
            <option value="all">All Classes</option>
            {[...new Set(DEALS.map(d => d.asset))].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--hairline-soft)" }}>
          <button className="btn sm" onClick={() => { setBox("all"); setRange("all"); setKlass("all"); }}>Reset</button>
          <span style={{ fontSize: 11, color: "#9DA2B3", alignSelf: "center" }}>{DEALS.length - filtered.length} hidden</span>
        </div>
      </div>

      {filtered.map((d, i) => (
        <MapPin key={d.id} deal={d} x={d.x * 100} y={d.y * 100} num={i + 1}
          selected={popup && popup.id === d.id}
          onClick={(deal) => setPopup(deal)}/>
      ))}

      {popup && (
        <div className="map-popup" style={{ left: `${popup.x * 100}%`, top: `${popup.y * 100}%` }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFF", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{popup.addr}</div>
              <div style={{ fontSize: 11, color: "#9DA2B3" }}>{popup.city}</div>
            </div>
            <ScoreBubble score={popup.score} size="sm"/>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="tag">{popup.asset}</span>
            <span className="tag">{popup.acres.toFixed(2)} ac</span>
            <span className="tag">{fmtMoney(popup.value)}</span>
          </div>
          <button className="btn primary sm block" style={{ marginTop: 10 }} onClick={() => onOpenDeal(popup)}>
            View Deal <I.Chevron size={12}/>
          </button>
        </div>
      )}

      <div className="map-controls">
        <button className="map-ctl-btn">+</button>
        <button className="map-ctl-btn">−</button>
        <button className="map-ctl-btn"><I.Pin size={14}/></button>
      </div>

      <div className="map-style-toggle seg">
        <button className={`seg-btn ${mapStyle === "dark" ? "active" : ""}`} onClick={() => setMapStyle("dark")}>Dark</button>
        <button className={`seg-btn ${mapStyle === "sat" ? "active" : ""}`} onClick={() => setMapStyle("sat")}>Satellite</button>
        <button className={`seg-btn ${mapStyle === "std" ? "active" : ""}`} onClick={() => setMapStyle("std")}>Standard</button>
      </div>
      <div className="scale-bar"><span className="bar"/>5 mi</div>
      <div className="map-attribution">© Parcyl GIS · Public Records</div>
    </div>
  );
}
