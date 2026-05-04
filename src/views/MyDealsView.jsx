import { useState, useMemo, useEffect } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { I } from '../components/Icons';
import { ScoreBubble } from '../components/DealComponents';
import { AerialThumb } from '../components/AerialThumb';
import { DealMap } from '../components/DealMap';
import { fmtMoney, agingColor } from '../lib/format';
import { LEGEND_ITEMS } from '../lib/assetColors';
import { StatusSelector } from '../components/StatusSelector';

const LS_KEY = 'parcyl-deals-filters';
const OWNER_TYPES = ['Individual', 'LLC', 'Trust', 'Corporate'];

function ownerTypeCategory(entityType) {
  if (!entityType) return 'Individual';
  if (entityType.includes('Trust')) return 'Trust';
  if (entityType.includes('LLC')) return 'LLC';
  return 'Corporate';
}

function loadFilters() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function MyDealsView({ onOpenDeal, selectedId }) {
  const { deals, buyBoxes, contacts, loading, updateStatus } = useDeals();
  const [box, setBox] = useState(() => loadFilters().box || "all");
  const [range, setRange] = useState(() => loadFilters().range || "month");
  const [klass, setKlass] = useState(() => loadFilters().klass || "all");
  const [sort, setSort] = useState(() => loadFilters().sort || "recent");
  const [distressTypes, setDistressTypes] = useState(() => loadFilters().distressTypes || []);
  const [ownerTypes, setOwnerTypes] = useState(() => loadFilters().ownerTypes || []);
  const [hasContactInfo, setHasContactInfo] = useState(() => loadFilters().hasContactInfo || false);
  const [hover, setHover] = useState(null);
  const [mapStyle, setMapStyle] = useState("dark");
  const [showLegend, setShowLegend] = useState(false);

  const assetClasses = useMemo(() => [...new Set(deals.map(d => d.asset))].filter(Boolean).sort(), [deals]);
  const activeBoxes = useMemo(() => buyBoxes.filter(b => b.status === "Active"), [buyBoxes]);
  const distressOptions = useMemo(() => [...new Set(deals.flatMap(d => d.signals || []))].sort(), [deals]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ box, range, klass, sort, distressTypes, ownerTypes, hasContactInfo }));
    } catch { /* quota exceeded — silently skip */ }
  }, [box, range, klass, sort, distressTypes, ownerTypes, hasContactInfo]);

  function toggleDistressType(dt) {
    setDistressTypes(prev => prev.includes(dt) ? prev.filter(x => x !== dt) : [...prev, dt]);
  }
  function toggleOwnerType(ot) {
    setOwnerTypes(prev => prev.includes(ot) ? prev.filter(x => x !== ot) : [...prev, ot]);
  }

  const filtered = useMemo(() => {
    let out = deals;
    if (box !== "all") out = out.filter(d => d.box === box);
    if (klass !== "all") out = out.filter(d => d.asset === klass);
    const days = range === "week" ? 7 : range === "month" ? 31 : range === "quarter" ? 92 : 9999;
    out = out.filter(d => d.days <= days);
    if (distressTypes.length > 0) out = out.filter(d => distressTypes.some(dt => (d.signals || []).includes(dt)));
    if (ownerTypes.length > 0) out = out.filter(d => ownerTypes.includes(ownerTypeCategory(d.entityType)));
    if (hasContactInfo) out = out.filter(d => d.dm?.phone || d.dm?.email);
    if (sort === "score") out = [...out].sort((a, b) => b.score - a.score);
    else if (sort === "value") out = [...out].sort((a, b) => b.value - a.value);
    else out = [...out].sort((a, b) => a.days - b.days);
    return out;
  }, [deals, box, range, klass, sort, distressTypes, ownerTypes, hasContactInfo]);

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

        {distressOptions.length > 0 && (
          <div className="filter-chips-row">
            <span className="select-label">Distress</span>
            {distressOptions.map(dt => (
              <button key={dt} className={`filter-chip ${distressTypes.includes(dt) ? 'active' : ''}`} onClick={() => toggleDistressType(dt)}>{dt}</button>
            ))}
          </div>
        )}
        <div className="filter-chips-row">
          <span className="select-label">Owner</span>
          {OWNER_TYPES.map(ot => (
            <button key={ot} className={`filter-chip ${ownerTypes.includes(ot) ? 'active' : ''}`} onClick={() => toggleOwnerType(ot)}>{ot}</button>
          ))}
          <button
            className={`filter-chip ${hasContactInfo ? 'active' : ''}`}
            onClick={() => setHasContactInfo(v => !v)}
            style={{ marginLeft: 8 }}
          >
            <I.Phone size={10} style={{ marginRight: 3, verticalAlign: "middle" }}/>Has Contact Info
          </button>
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
                  <span className="aging-chip" style={{ color: agingColor(d.days) }}>{d.days === 0 ? "Today" : `${d.days}d ago`}</span>
                  {d.fb === "hot" && <span className="fb hot"><I.Hot size={10}/> Hot</span>}
                  {d.fb === "no" && <span className="fb no">Not Relevant</span>}
                  {(contacts[d.id]?.length > 0) && <span className="pill blue" style={{ fontSize: 9 }}><I.Phone size={9}/> Contacted</span>}
                </div>
                <div style={{ marginTop: 5 }} onClick={e => e.stopPropagation()}>
                  <StatusSelector status={d.status || 'new'} onChangeStatus={s => updateStatus(d.id, s)} size="sm"/>
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
              <button className="btn primary sm" onClick={() => { setBox("all"); setRange("month"); setKlass("all"); setSort("recent"); setDistressTypes([]); setOwnerTypes([]); localStorage.removeItem(LS_KEY); }}>Reset Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
