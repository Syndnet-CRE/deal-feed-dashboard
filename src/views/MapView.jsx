import { useState, useMemo } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { DealMap } from '../components/DealMap';

export function MapView({ onOpenDeal }) {
  const { deals, buyBoxes } = useDeals();
  const [box, setBox] = useState("all");
  const [range, setRange] = useState("all");
  const [klass, setKlass] = useState("all");
  const [mapStyle, setMapStyle] = useState("dark");

  const assetClasses = useMemo(() => [...new Set(deals.map(d => d.asset))].filter(Boolean).sort(), [deals]);
  const activeBoxes = useMemo(() => buyBoxes.filter(b => b.status === "Active"), [buyBoxes]);

  const filtered = useMemo(() => {
    let out = deals;
    if (box !== "all") out = out.filter(d => d.box === box);
    if (klass !== "all") out = out.filter(d => d.asset === klass);
    const days = range === "week" ? 7 : range === "month" ? 31 : 9999;
    out = out.filter(d => d.days <= days);
    return out;
  }, [deals, box, range, klass]);

  return (
    <div className="map-wrap" style={{ height: "100%", position: "relative" }}>
      <DealMap
        deals={filtered}
        onClickDeal={onOpenDeal}
        withPopup={true}
        mapStyle={mapStyle}
        padding={120}
      />

      <div className="map-filter-panel" onClick={(e) => e.stopPropagation()}>
        <h4>Filters · {filtered.length} pins</h4>
        <div>
          <span className="select-label">Buy Box</span>
          <select className="select" style={{ width: "100%", marginTop: 4 }} value={box} onChange={(e) => setBox(e.target.value)}>
            <option value="all">All Buy Boxes</option>
            {activeBoxes.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
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
            {assetClasses.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--hairline-soft)" }}>
          <button className="btn sm" onClick={() => { setBox("all"); setRange("all"); setKlass("all"); }}>Reset</button>
          <span style={{ fontSize: 11, color: "#9DA2B3", alignSelf: "center" }}>{deals.length - filtered.length} hidden</span>
        </div>
      </div>

      <div className="map-style-toggle seg" style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
        <button className={`seg-btn ${mapStyle === "dark" ? "active" : ""}`} onClick={() => setMapStyle("dark")}>Dark</button>
        <button className={`seg-btn ${mapStyle === "satellite" ? "active" : ""}`} onClick={() => setMapStyle("satellite")}>Satellite</button>
        <button className={`seg-btn ${mapStyle === "standard" ? "active" : ""}`} onClick={() => setMapStyle("standard")}>Standard</button>
      </div>
    </div>
  );
}
