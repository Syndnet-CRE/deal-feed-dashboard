import { useState, useMemo } from 'react';
import { DEALS, BUY_BOXES } from '../data/mockData';
import { I } from '../components/Icons';
import { ScoreBubble, MapPin } from '../components/DealComponents';
import { AerialThumb } from '../components/AerialThumb';
import { MapBackground } from '../components/MapBackground';
import { fmtMoney } from '../lib/format';

export function MyDealsView({ onOpenDeal, selectedId }) {
  const [box, setBox] = useState("all");
  const [range, setRange] = useState("month");
  const [klass, setKlass] = useState("all");
  const [sort, setSort] = useState("recent");
  const [hover, setHover] = useState(null);

  const filtered = useMemo(() => {
    let out = DEALS;
    if (box !== "all") out = out.filter(d => d.box === box);
    if (klass !== "all") out = out.filter(d => d.asset === klass);
    const days = range === "week" ? 7 : range === "month" ? 31 : range === "quarter" ? 92 : 9999;
    out = out.filter(d => d.days <= days);
    if (sort === "score") out = [...out].sort((a, b) => b.score - a.score);
    else if (sort === "value") out = [...out].sort((a, b) => b.value - a.value);
    else out = [...out].sort((a, b) => a.days - b.days);
    return out;
  }, [box, range, klass, sort]);

  return (
    <div className="split-deals" style={{ height: "100%" }}>
      <div className="map-wrap" style={{ height: "100%" }}>
        <MapBackground density={1.4}/>
        {filtered.map((d, i) => (
          <div key={d.id} onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)}>
            <MapPin deal={d} x={d.x * 100} y={d.y * 100} num={i + 1} selected={hover === d.id || selectedId === d.id} onClick={() => onOpenDeal(d)}/>
          </div>
        ))}
        <div className="map-controls">
          <button className="map-ctl-btn">+</button>
          <button className="map-ctl-btn">−</button>
          <button className="map-ctl-btn" title="My Location"><I.Pin size={14}/></button>
        </div>
        <div className="map-style-toggle seg">
          <button className="seg-btn active">Dark</button>
          <button className="seg-btn">Satellite</button>
          <button className="seg-btn">Standard</button>
        </div>
        <div className="scale-bar"><span className="bar"/>2 mi</div>
        <div className="map-attribution">© Parcyl GIS · Public Records</div>
      </div>

      <div className="list-pane">
        <div className="filter-bar">
          <span className="select-label">Box</span>
          <select className="select" value={box} onChange={(e) => setBox(e.target.value)}>
            <option value="all">All Buy Boxes</option>
            {BUY_BOXES.filter(b => b.status === "Active").map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
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
            {[...new Set(DEALS.map(d => d.asset))].map(a => <option key={a} value={a}>{a}</option>)}
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
          {filtered.map((d, i) => (
            <div key={d.id} className={`deal-row-card ${hover === d.id || selectedId === d.id ? "selected" : ""}`}
              onClick={() => onOpenDeal(d)}
              onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)}>
              <div className="row-thumb"><AerialThumb id={d.id}/></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className="row-num" style={{ width: 22, height: 22, fontSize: 11, borderRadius: 4 }}>{i + 1}</span>
                  <span className="deal-addr" style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.addr}</span>
                </div>
                <div className="deal-loc" style={{ marginBottom: 6 }}>{d.city}</div>
                <div className="row-meta">
                  <span className="tag">{d.asset}</span>
                  <span><b>{d.acres.toFixed(2)}</b> ac</span>
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
          {filtered.length === 0 && (
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
