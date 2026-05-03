import { useState, useMemo } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { DEALS as MOCK_DEALS, BUY_BOXES as MOCK_BUY_BOXES } from '../data/mockData';
import { I } from '../components/Icons';
import { ScoreBubble } from '../components/DealComponents';
import { AerialThumb } from '../components/AerialThumb';
import { DealMap } from '../components/DealMap';
import { fmtMoney } from '../lib/format';
import { LEGEND_ITEMS } from '../lib/assetColors';

export function MyDealsView({ onOpenDeal, selectedId }) {
  const { deals: apiDeals, buyBoxes: apiBuyBoxes, loading } = useDeals();
  const deals = (!loading && apiDeals.length === 0) ? MOCK_DEALS : apiDeals;
  const buyBoxes = (!loading && apiBuyBoxes.length === 0) ? MOCK_BUY_BOXES : apiBuyBoxes;
  const [box, setBox] = useState("all");
  const [range, setRange] = useState("month");
  const [klass, setKlass] = useState("all");
  const [sort, setSort] = useState("recent");
  const [hover, setHover] = useState(null);
  const [mapStyle, setMapStyle] = useState("dark");
  const [showLegend, setShowLegend] = useState(false);

  const assetClasses = useMemo(() => [...new Set(deals.map(d => d.asset))].filter(Boolean).sort(), [deals]);
  const activeBoxes = useMemo(() => buyBoxes.filter(b => b.status === "Active"), [buyBoxes]);

  const filtered = useMemo(() => {
    let out = deals;
    if (box !== "all") out = out.filter(d => d.box === box);
    if (klass !== "all") out = out.filter(d => d.asset === klass);
    const days = range === "week" ? 7 : range === "month" ? 31 : range === "quarter" ? 92 : 9999;
    out = out.filter(d => d.days <= days);
    if (sort === "score") out = [...out].sort((a, b) => b.score - a.score);
    else if (sort === "value") out = [...out].sort((a, b) => b.value - a.value);
    else out = [...out].sort((a, b) => a.days - b.days);
    return out;
  }, [deals, box, range, klass, sort]);

  return (
    <div className="split-deals" style={{ height: "100%" }}>
      <div className="map-wrap" style={{ height: "100%", position: "relative" }}>
        <DealMap
          deals={filtered}
          selectedId={selectedId}
          hoverId={hover}
          onClickDeal={onOpenDeal}
          mapStyle={mapStyle}
        />
        <div className="map-style-toggle seg" style={{ position: "absolute", bottom: 32, left: 16, zIndex: 10 }}>
          <button className={`seg-btn ${mapStyle === "dark" ? "active" : ""}`} onClick={() => setMapStyle("dark")}>Dark</button>
          <button className={`seg-btn ${mapStyle === "satellite" ? "active" : ""}`} onClick={() => setMapStyle("satellite")}>Satellite</button>
          <button className={`seg-btn ${mapStyle === "standard" ? "active" : ""}`} onClick={() => setMapStyle("standard")}>Standard</button>
        </div>
        <div style={{ position: "absolute", bottom: 32, right: 52, zIndex: 10 }}>
          <button className="seg-btn" onClick={() => setShowLegend(v => !v)}
            style={{ background: "#1A1B22CC", border: "1px solid #2A2B34", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#CDD1E0", cursor: "pointer" }}>
            {showLegend ? "Hide Legend" : "Legend"}
          </button>
          {showLegend && (
            <div style={{ position: "absolute", bottom: 36, right: 0, background: "#1A1B22EE", border: "1px solid #2A2B34", borderRadius: 8, padding: "10px 14px", minWidth: 170 }}>
              {LEGEND_ITEMS.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: item.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, color: "#CDD1E0" }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="list-pane">
        <div className="filter-bar">
          <span className="select-label">Box</span>
          <select className="select" value={box} onChange={(e) => setBox(e.target.value)}>
            <option value="all">All Buy Boxes</option>
            {activeBoxes.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <span className="select-label" style={{ marginLeft: 4 }}>Range</span>
          <select className="select" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="all">All Time</option>
          </select>
          <span className="select-label" style={{ marginLeft: 4 }}>Class</span>
          <select className="select" value={klass} onChange={(e) => setKlass(e.target.value)}>
            <option value="all">All</option>
            {assetClasses.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div style={{ flex: 1 }}/>
          <span className="select-label">Sort</span>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="score">Highest Distress</option>
            <option value="value">Highest Assessed Value</option>
          </select>
        </div>

        <div className="list-results-meta">
          <span>{filtered.length} deals · sorted by {sort === "recent" ? "delivery date" : sort === "score" ? "distress score" : "assessed value"}</span>
          <button className="btn sm"><I.External size={11}/> Export CSV</button>
        </div>

        <div className="list-scroll">
          {loading ? (
            <div style={{ padding: 24, color: "#9DA2B3", fontSize: 13 }}>Loading deals…</div>
          ) : filtered.map((d, i) => (
            <div key={d.id} className={`deal-row-card ${hover === d.id || selectedId === d.id ? "selected" : ""}`}
              onClick={() => onOpenDeal(d)}
              onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)}>
              <div className="row-thumb"><AerialThumb id={d.id} lat={d.lat} lng={d.lng}/></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className="row-num" style={{ width: 22, height: 22, fontSize: 11, borderRadius: 4 }}>{i + 1}</span>
                  <span className="deal-addr" style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.addr}</span>
                </div>
                <div className="deal-loc" style={{ marginBottom: 6 }}>{d.city}</div>
                <div className="row-meta">
                  <span className="tag">{d.asset}</span>
                  <span><b>{d.acres?.toFixed(2)}</b> ac</span>
                  <span><b>{fmtMoney(d.value)}</b></span>
                  <span>{d.days === 0 ? "Today" : `${d.days}d ago`}</span>
                  {d.fb === "hot" && <span className="fb hot"><I.Hot size={10}/> Hot</span>}
                  {d.fb === "no" && <span className="fb no">Not Relevant</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <ScoreBubble score={d.score} size="md"/>
                <span style={{ fontSize: 9.5, color: "#9DA2B3", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Distress</span>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="empty">
              <div className="empty-ico"><I.Filter size={22}/></div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>No deals match these filters</div>
              <div className="empty-msg">Try widening the date range or selecting all buy boxes.</div>
              <button className="btn primary sm" onClick={() => { setBox("all"); setRange("all"); setKlass("all"); }}>Reset Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
