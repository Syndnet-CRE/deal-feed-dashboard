import { useState, useEffect, useRef, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Star, Download, Link2, EyeOff, Flag, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScoreBadge from '../ScoreBadge';
import OverflowMenu from '../OverflowMenu';
import DealChatThread from './DealChatThread';
import { fmt, fmtMoney } from '../../lib/format';
import { api } from '../../lib/api';
import { useDeals } from '../../contexts/DealsContext.jsx';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

function fmtTimestamp(sentAt) {
  if (!sentAt) return '';
  const d = new Date(sentAt);
  const now = new Date();
  const diffMs = now - d;
  const diffH = diffMs / 3600000;
  const diffDays = diffMs / 86400000;
  if (diffH < 1) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffDays < 2) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const QUICK_FACTS_CONFIG = {
  self_storage: [
    { label: 'Net Rentable SF', key: 'building_sf', format: v => v ? `${Number(v).toLocaleString()} SF` : '—' },
    { label: 'Assessed Value',  key: 'assessed_value', format: fmtMoney },
    { label: 'Years Held',      key: 'owner_since', format: v => v ? `${new Date().getFullYear() - new Date(v).getFullYear()} yrs` : '—' },
  ],
  land: [
    { label: 'Lot Size',   key: 'acres',    format: v => v ? `${Number(v).toFixed(2)} ac` : '—' },
    { label: 'Zoning',     key: 'zoning',   format: fmt },
    { label: 'Years Held', key: 'owner_since', format: v => v ? `${new Date().getFullYear() - new Date(v).getFullYear()} yrs` : '—' },
  ],
  multifamily: [
    { label: 'Units',          key: 'units',    format: v => v ? `${v} units` : '—' },
    { label: 'Value/Unit',     key: 'assessed_value', format: (v, deal) => deal.units ? fmtMoney(v / deal.units) : '—' },
    { label: 'Ownership Type', key: 'owner_type', format: fmt },
  ],
  industrial: [
    { label: 'Building SF', key: 'building_sf',  format: v => v ? `${Number(v).toLocaleString()} SF` : '—' },
    { label: 'Assessed',    key: 'assessed_value', format: fmtMoney },
    { label: 'Years Held',  key: 'owner_since', format: v => v ? `${new Date().getFullYear() - new Date(v).getFullYear()} yrs` : '—' },
  ],
  retail: [
    { label: 'GLA',        key: 'building_sf',    format: v => v ? `${Number(v).toLocaleString()} SF` : '—' },
    { label: 'Zoning',     key: 'zoning',         format: fmt },
    { label: 'Last Sale',  key: 'last_sale_date', format: v => v ? new Date(v).getFullYear() : '—' },
  ],
};

const DEFAULT_FACTS = [
  { label: 'Lot Size',      key: 'acres',          format: v => v ? `${Number(v).toFixed(2)} ac` : '—' },
  { label: 'Assessed',      key: 'assessed_value', format: fmtMoney },
  { label: 'Years Held',    key: 'owner_since', format: v => v ? `${new Date().getFullYear() - new Date(v).getFullYear()} yrs` : '—' },
];

function normalizeAssetClass(raw) {
  const s = (raw || '').toLowerCase();
  if (!s) return '';
  // Match against the 10-class MVP taxonomy from backend.
  if (s.includes('self storage') || s.includes('mini-warehouse') || s.includes('mini warehouse')) return 'self_storage';
  if (s.includes('mobile') || s.includes('manufactured home') || s.includes('rv park')) return 'mobile_home_rv';
  if (s.includes('multifamily') || s.includes('duplex') || s.includes('triplex') || s.includes('quadruplex') || s.includes('apartment') || s.includes('residential income') || s.includes('loft')) return 'multifamily';
  if (s.includes('single family') || s.includes('condominium') || s.includes('townhouse') || s.includes('cabin') || s.includes('cottage') || s.includes('zero lot') || s === 'sfr' || s === 'residential_sfr') return 'residential_sfr';
  if (s.includes('vacant land') || s.includes('agricultural') || s.includes('ranch') || s.includes('cropland') || s.includes('pastureland') || s.includes('timberland') || s === 'land') return 'land';
  if (s.includes('industrial') || s.includes('warehouse') || s.includes('manufacturing') || s.includes('flex') || s.includes('truck terminal')) return 'industrial';
  if (s.includes('gas station') || s.includes('service station')) return 'gas_station_c_store';
  if (s.includes('retail') || s.includes('shopping') || s.includes('storefront') || s.includes('restaurant') || s.includes('grocery') || s.includes('strip mall') || s.includes('drugstore') || s.includes('pharmacy') || s.includes('laundromat') || s.includes('car wash') || s.includes('auto dealership') || s.includes('auto repair') || s.includes('convenience store') || s.includes('fast food') || s.includes('qsr')) return 'retail';
  if (s.includes('office') || s.includes('mixed-use commercial') || s.includes('professional office') || s.includes('medical office')) return 'office';
  if (s.includes('bank') || s.includes('parking') || s.includes('bowling') || s.includes('theater') || s.includes('funeral') || s.includes('rehabilitation') || s.includes('skilled nursing') || s.includes('healthcare') || s.includes('medical clinic') || s.includes('day care') || s.includes('child care') || s.includes('special purpose')) return 'special_purpose';
  return s.replace(/\s+/g, '_');
}

function quickFacts(deal) {
  const ac = normalizeAssetClass(deal.asset_class || deal.asset);
  return QUICK_FACTS_CONFIG[ac] || DEFAULT_FACTS;
}

function signalColor(sig) {
  const raw = typeof sig === 'string' ? sig : (sig.type || sig.category || sig.label || '');
  const t = raw.toLowerCase();
  if (t.includes('tax') || t.includes('lien') || t.includes('delinq') || t.includes('forecl')) return 'red';
  if (t.includes('vacan') || t.includes('code') || t.includes('rising') || t.includes('absentee')) return 'amber';
  return 'green';
}

function ExpandedDetail({ deal }) {
  const bj = deal.briefJson || deal.brief_json || {};
  const fields = [
    ['Owner', fmt(deal.owner_name || deal.owner)],
    ['Owner Type', fmt(deal.owner_type)],
    ['Owner Since', deal.owner_since ? new Date(deal.owner_since).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '—'],
    ['Mailing Address', fmt(deal.owner_mailing || deal.mailing)],
    ['Assessed Value', fmtMoney(deal.assessed_value || deal.value)],
    ['Last Sale', deal.last_sale_date ? `${new Date(deal.last_sale_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}${deal.last_sale_price ? ` · ${fmtMoney(deal.last_sale_price)}` : ''}` : '—'],
    ['Lot Size', deal.acres ? `${Number(deal.acres).toFixed(2)} ac` : (deal.lot_sf ? `${Number(deal.lot_sf).toLocaleString()} SF` : '—')],
    ['Building SF', deal.building_sf ? `${Number(deal.building_sf).toLocaleString()} SF` : '—'],
    ['Zoning', fmt(deal.zoning)],
    ['APN', fmt(deal.apn)],
    ['Tax Delinquent', deal.tax_delinquent ? `Yes — ${fmtMoney(deal.tax_delinquent)}` : 'No'],
  ];

  const signals = bj.signal_tags || deal.signals || [];

  return (
    <div className="feed-deal-expand">
      <div className="feed-deal-expand-grid">
        {fields.map(([label, value]) => (
          <div key={label} className="feed-deal-expand-row">
            <span className="feed-deal-expand-label">{label}</span>
            <span className="feed-deal-expand-value">{value}</span>
          </div>
        ))}
      </div>
      {signals.length > 0 && (
        <div className="feed-deal-signals">
          <div className="feed-deal-signals-label">Distress Signals</div>
          <div className="feed-deal-signals-list">
            {signals.map((s, i) => {
              const color = signalColor(s);
              const label = typeof s === 'string' ? s : s.label || s.type || String(s);
              return <span key={i} className={`feed-deal-signal-pill ${color}`}>{label}</span>;
            })}
          </div>
        </div>
      )}
      <div className="feed-deal-expand-cta">
        <a href={`/deal/${deal.id}`} className="btn primary sm">Open full detail</a>
      </div>
    </div>
  );
}

export default function FeedDealCard({ deal, onHide, isRead: isReadProp }) {
  const navigate = useNavigate();
  const { postFeedback } = useDeals();
  const [isRead, setIsRead] = useState(deal.is_read || isReadProp || false);
  const [saved, setSaved] = useState(deal.saved || false);
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notRelevantUndo, setNotRelevantUndo] = useState(deal.feedback === 'not_relevant');
  const cardRef = useRef(null);
  const readTimerRef = useRef(null);
  const hasTracked = useRef(isRead);

  // Feedback is the single source of truth from DealsContext via the deal prop
  const fb = deal.feedback || null;

  const markRead = useCallback(async () => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    setIsRead(true);
    try {
      await api.patch(`/api/dealfeed/deals/${deal.id}/read`, {});
    } catch { /* silent — read tracking is best-effort */ }
  }, [deal.id]);

  useEffect(() => {
    if (hasTracked.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          readTimerRef.current = setTimeout(markRead, 2000);
        } else {
          clearTimeout(readTimerRef.current);
        }
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) obs.observe(cardRef.current);
    return () => { obs.disconnect(); clearTimeout(readTimerRef.current); };
  }, [markRead]);

  async function handleFeedback(val) {
    const next = fb === val ? null : val;
    if (next === 'not_relevant') setNotRelevantUndo(true);
    await postFeedback(deal.id, next);
  }

  async function handleSave() {
    setSaved(s => !s);
    try {
      await api.patch(`/api/dealfeed/deals/${deal.id}/save`, {});
    } catch { setSaved(s => !s); }
  }

  function handleHide() {
    setHidden(true);
    onHide?.(deal.id);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/deal/${deal.id}`);
  }

  const overflowItems = [
    { label: 'Save Deal',    icon: <Star size={14} />,     onClick: handleSave },
    { label: 'Export PDF',   icon: <Download size={14} />, disabled: true, disabledTip: 'Coming soon — deal export' },
    { label: 'Share Link',   icon: <Link2 size={14} />,    onClick: handleCopyLink },
    { label: 'Hide Deal',    icon: <EyeOff size={14} />,   onClick: handleHide },
    { label: 'Report Issue', icon: <Flag size={14} />,     onClick: () => api.post(`/api/dealfeed/deals/${deal.id}/feedback`, { feedback: 'flagged' }).catch(() => {}) },
  ];

  if (hidden) return null;

  const facts = quickFacts(deal);
  const notRelevant = fb === 'not_relevant';
  const bj = deal.briefJson || deal.brief_json || {};
  const headline = bj.headline || null;
  const nextAction = bj.next_action || null;

  return (
    <article
      ref={cardRef}
      className={`feed-deal-card ${!isRead ? 'unread' : ''} ${notRelevant ? 'dimmed' : ''}`}
    >
      <div className="feed-deal-byline">
        <span className="feed-deal-avatar">N</span>
        <span className="feed-deal-agent">Nightdrop Agent</span>
        <span className="feed-deal-dot">·</span>
        <span className="feed-deal-ts">{fmtTimestamp(deal.sentAt)}</span>
        <OverflowMenu items={overflowItems} className="feed-deal-overflow" />
      </div>

      <div className="feed-deal-image-wrap" onClick={() => navigate(`/deal/${deal.id}`)}>
        {MAPBOX_TOKEN && deal.lat && deal.lng ? (
          <img
            className="feed-deal-image"
            src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${deal.lng},${deal.lat},16/1024x280@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`}
            alt={deal.addr || deal.address}
            loading="lazy"
            onError={e => {
              e.target.style.display = 'none';
              const fb = e.target.nextElementSibling;
              if (fb) fb.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="feed-deal-image-fallback"
          style={{ display: MAPBOX_TOKEN && deal.lat && deal.lng ? 'none' : 'flex' }}
        >
          <span className="feed-deal-image-placeholder">{deal.asset_class || deal.asset || 'Property'}</span>
        </div>
        <ScoreBadge score={deal.score || deal.match_score} className="feed-deal-score" />
      </div>

      <div className="feed-deal-body">
        <div className="feed-deal-address">{deal.addr || deal.address}</div>
        <div className="feed-deal-city">{deal.city || [deal.property_city, deal.property_state, deal.property_zip].filter(Boolean).join(', ')}</div>

        <div className="feed-deal-facts">
          {facts.map(({ label, key, format }) => (
            <div key={label} className="feed-deal-fact">
              <span className="feed-deal-fact-label">{label}</span>
              <span className="feed-deal-fact-value">{format(deal[key], deal)}</span>
            </div>
          ))}
        </div>

        {headline && (
          <p className="feed-deal-headline">{headline}</p>
        )}

        {deal.narrative && (
          <p className="feed-deal-narrative">{deal.narrative}</p>
        )}

        {nextAction && (
          <div className="feed-deal-next-action">
            <span className="feed-deal-next-action-label">Next Action</span>
            <span className="feed-deal-next-action-text">{nextAction}</span>
          </div>
        )}

        {notRelevant && notRelevantUndo ? (
          <div className="feed-deal-not-relevant">
            <span>Not Relevant</span>
            <button className="link-btn" onClick={() => { handleFeedback('not_relevant'); setNotRelevantUndo(false); }}>Undo</button>
            <span className="muted" style={{ fontSize: 12 }}>Got it. This shapes tonight&apos;s run.</span>
          </div>
        ) : (
          <div className="feed-deal-actions">
            <div className="feed-deal-reactions">
              <button
                className={`feed-deal-reaction-btn ${fb === 'hot' ? 'active-hot' : ''}`}
                onClick={() => handleFeedback('hot')}
                title="Hot deal"
              >
                <ThumbsUp size={16} />
              </button>
              <button
                className={`feed-deal-reaction-btn ${fb === 'not_relevant' ? 'active-cold' : ''}`}
                onClick={() => handleFeedback('not_relevant')}
                title="Not relevant"
              >
                <ThumbsDown size={16} />
              </button>
              <button
                className={`feed-deal-reaction-btn ${chatOpen ? 'active-chat' : ''}`}
                onClick={() => setChatOpen(o => !o)}
                title="Discuss this deal"
              >
                <MessageCircle size={16} />
              </button>
              <button
                className={`feed-deal-reaction-btn ${saved ? 'active-saved' : ''}`}
                onClick={handleSave}
                title={saved ? 'Saved' : 'Save deal'}
              >
                <Star size={16} fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>
            <span className="feed-deal-box-pill">Box: {deal.box || deal.buy_box_name}</span>
            <button
              className="feed-deal-expand-btn"
              onClick={() => setExpanded(e => !e)}
            >
              View Details {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}

        {expanded && <ExpandedDetail deal={deal} />}

        {chatOpen && (
          <DealChatThread
            dealId={deal.id}
            dealAddress={deal.addr || deal.address || ''}
            autoFocus
          />
        )}
      </div>
    </article>
  );
}
