import { useState, useRef, useCallback, useEffect } from 'react';
import { Map, Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPinSVG, ScoreBubble } from './DealComponents';
import { fmtMoney } from '../lib/format';
import { I } from './Icons';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  standard: 'mapbox://styles/mapbox/streets-v12',
};

const ATL_DEFAULT = { latitude: 33.85, longitude: -84.4, zoom: 9 };

function fitDeals(mapRef, deals, padding = 80) {
  const pts = deals.filter(d => d.lat && d.lng);
  if (!mapRef.current || pts.length === 0) return;
  if (pts.length === 1) {
    mapRef.current.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 13, duration: 800 });
    return;
  }
  const lngs = pts.map(d => d.lng);
  const lats = pts.map(d => d.lat);
  mapRef.current.fitBounds(
    [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
    { padding, duration: 800 }
  );
}

export function DealMap({
  deals = [],
  selectedId = null,
  hoverId = null,
  onClickDeal,
  mapStyle = 'dark',
  withPopup = false,
  padding = 80,
}) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState(ATL_DEFAULT);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    fitDeals(mapRef, deals, padding);
  }, [deals, padding]);

  const handleMarkerClick = useCallback((e, deal) => {
    e.originalEvent?.stopPropagation();
    if (withPopup) {
      setPopup(deal);
    } else {
      onClickDeal?.(deal);
    }
  }, [withPopup, onClickDeal]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle={STYLES[mapStyle] || STYLES.dark}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      onClick={() => setPopup(null)}
    >
      <NavigationControl position="top-right" showCompass={false}/>

      {deals.map((d, i) => {
        if (!d.lat || !d.lng) return null;
        const active = selectedId === d.id || hoverId === d.id;
        return (
          <Marker
            key={d.id}
            latitude={d.lat}
            longitude={d.lng}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(e, d)}
          >
            <div style={{ cursor: 'pointer', transform: active ? 'scale(1.25)' : 'scale(1)', transition: 'transform 0.15s', zIndex: active ? 10 : 1, position: 'relative' }}>
              <MapPinSVG score={d.score} num={i + 1} selected={active} asset={d.asset}/>
            </div>
          </Marker>
        );
      })}

      {withPopup && popup && (
        <Popup
          latitude={popup.lat}
          longitude={popup.lng}
          anchor="bottom"
          offset={36}
          closeButton={false}
          onClose={() => setPopup(null)}
          style={{ padding: 0 }}
        >
          <div style={{ background: '#1A1B22', border: '1px solid #2A2B34', borderRadius: 8, padding: '12px 14px', minWidth: 220, maxWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{popup.addr}</div>
                <div style={{ fontSize: 11, color: '#9DA2B3' }}>{popup.city}</div>
              </div>
              <ScoreBubble score={popup.score} size="sm"/>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="tag">{popup.asset}</span>
              <span className="tag">{popup.acres?.toFixed(2)} ac</span>
              <span className="tag">{fmtMoney(popup.value)}</span>
            </div>
            <button className="btn primary sm" style={{ marginTop: 10, width: '100%' }}
              onClick={() => { onClickDeal?.(popup); setPopup(null); }}>
              View Deal <I.Chevron size={12}/>
            </button>
          </div>
        </Popup>
      )}
    </Map>
  );
}
