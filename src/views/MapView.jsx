import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { DEALS as MOCK_DEALS, BUY_BOXES as MOCK_BUY_BOXES } from '../data/mockData';
import { DealMap } from '../components/DealMap';
import { I } from '../components/Icons';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const THUMB_REF = '-97.742,30.266,10'; // Austin, TX — fixed reference for style previews

function styleThumbUrl(style) {
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${THUMB_REF}/160x90@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`;
}

const STYLE_THUMBS = {
  dark:      { label: 'Dark',      styleId: 'dark-v11' },
  satellite: { label: 'Satellite', styleId: 'satellite-streets-v12' },
  standard:  { label: 'Standard',  styleId: 'streets-v12' },
};

const STYLE_KEY    = 'parcyl-map-style';
const VIEWPORT_KEY = 'parcyl-map-viewport';

function loadStyle()    { return localStorage.getItem(STYLE_KEY) || 'satellite'; }
function loadViewport() {
  try { const v = localStorage.getItem(VIEWPORT_KEY); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

export function MapView({ onOpenDeal }) {
  const { deals: apiDeals, buyBoxes: apiBuyBoxes, loading } = useDeals();
  const deals    = (!loading && apiDeals.length   === 0) ? MOCK_DEALS    : apiDeals;
  const buyBoxes = (!loading && apiBuyBoxes.length === 0) ? MOCK_BUY_BOXES : apiBuyBoxes;

  const [box,         setBox]         = useState("all");
  const [range,       setRange]       = useState("all");
  const [klass,       setKlass]       = useState("all");
  const [mapStyle,    setMapStyle]    = useState(loadStyle);
  const [viewport,    setViewport]    = useState(loadViewport);
  const [activePanel, setActivePanel] = useState(null);

  const assetClasses = useMemo(() => [...new Set(deals.map(d => d.asset))].filter(Boolean).sort(), [deals]);
  const activeBoxes  = useMemo(() => buyBoxes.filter(b => b.status === "Active"), [buyBoxes]);

  const filtered = useMemo(() => {
    let out = deals;
    if (box   !== "all") out = out.filter(d => d.box   === box);
    if (klass !== "all") out = out.filter(d => d.asset === klass);
    const days = range === "week" ? 7 : range === "month" ? 31 : 9999;
    out = out.filter(d => d.days <= days);
    return out;
  }, [deals, box, range, klass]);

  const handleStyleChange = useCallback((style) => {
    setMapStyle(style);
    localStorage.setItem(STYLE_KEY, style);
    setActivePanel(null);
  }, []);

  const handleViewportChange = useCallback((vp) => {
    setViewport(vp);
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(vp));
  }, []);

  const togglePanel = useCallback((panel) => {
    setActivePanel(p => p === panel ? null : panel);
  }, []);

  const toolbarRef = useRef(null);
  useEffect(() => {
    if (!activePanel) return;
    const onDown = (e) => { if (!toolbarRef.current?.contains(e.target)) setActivePanel(null); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [activePanel]);

  return (
    <div className="map-wrap" style={{ height: "100%", position: "relative" }}>
      <DealMap
        deals={filtered}
        onClickDeal={onOpenDeal}
        withPopup={true}
        mapStyle={mapStyle}
        padding={120}
        initialViewState={viewport}
        onViewStateChange={handleViewportChange}
      />

      <div className="map-toolbar" ref={toolbarRef}>
        {/* Filters */}
        <div className="mt-slot">
          <button className={`mt-btn ${activePanel === 'filters' ? 'active' : ''}`} onClick={() => togglePanel('filters')} title="Filters">
            <I.Filter size={16}/>
            {filtered.length < deals.length && <span className="mt-badge"/>}
          </button>
          {activePanel === 'filters' && (
            <div className="mt-panel">
              <div className="mt-panel-head">
                <span>Filters</span>
                <span className="mt-pin-count">{filtered.length} pins</span>
              </div>
              <div className="mt-field">
                <span className="select-label">Buy Box</span>
                <select className="select" style={{ width: "100%", marginTop: 4 }} value={box} onChange={(e) => setBox(e.target.value)}>
                  <option value="all">All Buy Boxes</option>
                  {activeBoxes.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div className="mt-field">
                <span className="select-label">Date Range</span>
                <select className="select" style={{ width: "100%", marginTop: 4 }} value={range} onChange={(e) => setRange(e.target.value)}>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div className="mt-field">
                <span className="select-label">Asset Class</span>
                <select className="select" style={{ width: "100%", marginTop: 4 }} value={klass} onChange={(e) => setKlass(e.target.value)}>
                  <option value="all">All Classes</option>
                  {assetClasses.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="mt-panel-foot">
                <button className="btn sm" onClick={() => { setBox("all"); setRange("all"); setKlass("all"); }}>Reset</button>
                <span className="mt-hidden">{deals.length - filtered.length} hidden</span>
              </div>
            </div>
          )}
        </div>

        {/* Map Style */}
        <div className="mt-slot">
          <button className={`mt-btn ${activePanel === 'style' ? 'active' : ''}`} onClick={() => togglePanel('style')} title="Map Style">
            <I.Layers size={16}/>
          </button>
          {activePanel === 'style' && (
            <div className="mt-panel">
              <div className="mt-panel-head"><span>Map Style</span></div>
              <div className="mt-style-grid">
                {Object.entries(STYLE_THUMBS).map(([key, thumb]) => (
                  <button key={key} className={`mt-style-opt ${mapStyle === key ? 'active' : ''}`} onClick={() => handleStyleChange(key)}>
                    <div className="mt-thumb">
                      <img src={styleThumbUrl(thumb.styleId)} alt={thumb.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 4 }} onError={e => { e.currentTarget.style.display = 'none'; }}/>
                    </div>
                    <span>{thumb.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
