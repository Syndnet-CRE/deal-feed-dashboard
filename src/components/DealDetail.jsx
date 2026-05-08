import { Fragment, useState, useEffect, useRef } from 'react';
import { AerialThumb } from './AerialThumb.jsx';
import { ContactLogModal } from './ContactLogModal.jsx';
import { fmt, fmtMoney, hasVal } from '../lib/format.js';
import { useDeals } from '../contexts/DealsContext.jsx';
import { useReadState } from '../contexts/ReadStateContext';
import '../styles/deal-detail.css';

const TABS = [
  { id: 'summary',      label: 'Summary' },
  { id: 'property',     label: 'Property Record' },
  { id: 'ownership',    label: 'Ownership' },
  { id: 'financials',   label: 'Financials' },
  { id: 'capital',      label: 'Capital Stack' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'site',         label: 'Site & Lot' },
  { id: 'zoning',       label: 'Zoning' },
  { id: 'context',      label: 'Site Context' },
  { id: 'risk',         label: 'Risk' },
  { id: 'distress',     label: 'Distress' },
  { id: 'dealintel',    label: 'Deal Intel' },
];

const STATUS_OPTIONS = ['new', 'due_diligence', 'contacted', 'negotiating', 'offer_made', 'dead'];
const STATUS_LABELS = { new: 'New', due_diligence: 'Due Diligence', contacted: 'Contacted', negotiating: 'Negotiating', offer_made: 'Offer Made', dead: 'Dead' };
const STATUS_COLORS = { new: 'gray', due_diligence: 'blue', contacted: 'amber', negotiating: 'amber', offer_made: 'green', dead: 'red' };

function nv(v) {
  if (v === null || v === undefined || v === '' || v === 'null' || v === 'undefined') return null;
  return v;
}
function pct(v) {
  if (!hasVal(v)) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : (n * 100).toFixed(1) + '%';
}
function mon(v) {
  if (!hasVal(v)) return null;
  return fmtMoney(v);
}
function sf(v) {
  if (!hasVal(v)) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n.toLocaleString() + ' sf';
}
function scoreVariant(score) {
  if (!hasVal(score)) return 'none';
  const n = parseFloat(score);
  if (isNaN(n)) return 'none';
  if (n >= 70) return 'hi';
  if (n >= 40) return 'md';
  return 'lo';
}

function Rows({ data, wide }) {
  const visible = data.filter(([, v]) => nv(v) !== null && hasVal(v));
  if (!visible.length) {
    return <span style={{ color: 'var(--fg-4)', fontSize: 'var(--t-cap)' }}>No data available</span>;
  }
  return (
    <div className={`dd-rows${wide ? ' wide' : ''}`}>
      {visible.map(([label, val], i) => (
        <Fragment key={i}>
          <span className="dd-row-label">{label}</span>
          <span className="dd-row-val">{val}</span>
        </Fragment>
      ))}
    </div>
  );
}

function SecHead({ title, date }) {
  return (
    <div className="dd-sec-head">
      <span className="dd-sec-title">{title}</span>
      {date && <span className="dd-sec-updated">Updated {fmt(date)} »</span>}
    </div>
  );
}

function Chip({ color = 'gray', children }) {
  return <span className={`dd-pill ${color}`}>{children}</span>;
}

function ConfBadge({ conf }) {
  if (!conf) return null;
  const color = conf === 'high' ? 'green' : conf === 'medium' ? 'amber' : 'gray';
  return <span className={`dd-conf-badge ${color}`}>{conf}</span>;
}

export function DealDetail({ deal, onClose, deals, dealIndex, onNavigateDeal }) {
  const { postFeedback, updateStatus, logContact, fetchContacts, contacts, dealNotes, fetchDealNotes, createDealNote } = useDeals();
  const { markRead } = useReadState();
  const [activeTab, setActiveTab] = useState('summary');
  const [hotLoading, setHotLoading] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => { markRead(deal.id); }, [deal.id, markRead]);
  useEffect(() => { fetchContacts(deal.id); }, [deal.id, fetchContacts]);
  useEffect(() => { fetchDealNotes(deal.id); }, [deal.id, fetchDealNotes]);

  useEffect(() => {
    if (!showStatusDropdown) return;
    function onOutside(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDropdown(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showStatusDropdown]);

  const bj = deal.briefJson || deal.brief_json || {};
  const enriched = bj.enriched_at || deal.updated_at;
  const score = deal.distress_score ?? deal.score;
  const variant = scoreVariant(score);
  const scoreLabel = hasVal(score) ? `Score ${Math.round(parseFloat(score))}` : 'No Score';
  const city = [deal.city, deal.state].filter(Boolean).join(', ');
  const cityMsa = [city, deal.msa].filter(Boolean).join(' · ');
  const line2Parts = [cityMsa, deal.asset_class || deal.use_type].filter(Boolean);
  const currentStatus = deal.status || 'new';
  const statusColor = STATUS_COLORS[currentStatus] || 'gray';
  const statusLabel = STATUS_LABELS[currentStatus] || currentStatus;
  const dealContactList = contacts[deal.id] || [];
  const dealNotesList = dealNotes[deal.id] || [];
  const signals = bj.distress_signals || deal.signals || [];

  function signalColor(sig) {
    const t = (sig.type || sig.category || '').toLowerCase();
    if (t.includes('tax') || t.includes('lien') || t.includes('delinq') || t.includes('forecl')) return 'red';
    if (t.includes('vacan') || t.includes('code') || t.includes('rising')) return 'amber';
    return 'green';
  }

  function ownerDistanceCell() {
    const mailing = deal.owner_mailing || bj.owner_mailing;
    if (!mailing) return null;
    const match = mailing.match(/\b([A-Z]{2})\b/);
    if (!match) return null;
    const ownerState = match[1];
    if (!deal.state) return ownerState;
    return ownerState === deal.state ? 'Local' : `Out of State (${ownerState})`;
  }

  function scrollToSection(id) {
    setActiveTab(id);
    const el = document.getElementById('dd-' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleMarkHot() {
    setHotLoading(true);
    try {
      await postFeedback(deal.id, deal.feedback === 'hot' ? null : 'hot');
    } finally {
      setHotLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setShowStatusDropdown(false);
    await updateStatus(deal.id, newStatus);
  }

  async function handleLogContact(formData) {
    setContactSubmitting(true);
    try {
      await logContact(deal.id, formData);
      setContactModalOpen(false);
    } finally {
      setContactSubmitting(false);
    }
  }

  async function handleAddNote() {
    if (!noteInput.trim()) return;
    setNoteSaving(true);
    try {
      await createDealNote(deal.id, noteInput.trim());
      setNoteInput('');
    } finally {
      setNoteSaving(false);
    }
  }

  const propertyRows = [
    ['Parcel ID',      fmt(deal.parcel_id ?? deal.attom_id)],
    ['APN',            fmt(deal.apn)],
    ['Address',        fmt(deal.address)],
    ['City / State',   city || null],
    ['Zip',            fmt(deal.zip)],
    ['County',         fmt(deal.county)],
    ['MSA',            fmt(deal.msa)],
    ['Asset Class',    fmt(deal.asset_class)],
    ['Use Type',       fmt(deal.use_type)],
    ['Zoning',         fmt(deal.zoning)],
    ['Year Built',     fmt(deal.year_built)],
    ['Yr Renovated',   fmt(bj.year_renovated)],
    ['Construction',   fmt(bj.construction_type)],
    ['Stories',        fmt(deal.stories)],
    ['Units',          fmt(deal.units)],
    ['Sq Ft (Bldg)',   sf(deal.building_sf)],
    ['Lot Sq Ft',      sf(deal.lot_sf ?? bj.lot_sf)],
    ['Lot Acres',      bj.lot_ac ? bj.lot_ac + ' ac' : null],
    ['Parking Spaces', fmt(bj.parking_spaces)],
  ];

  const ownershipRows = [
    ['Owner Name',   fmt(deal.owner_name)],
    ['Entity Type',  fmt(bj.entity_type)],
    ['Mailing Addr', fmt(bj.owner_mailing ?? deal.owner_mailing)],
    ['Owner Since',  fmt(bj.owner_since ?? deal.owner_since)],
    ['Hold Period',  bj.hold_years ? bj.hold_years + ' yrs' : null],
    ['Owner Type',   fmt(deal.owner_type)],
    ['Absentee',     deal.absentee_owner != null ? (deal.absentee_owner ? 'Yes' : 'No') : null],
    ['Phone',        fmt(bj.dm?.phone)],
    ['Email',        fmt(bj.dm?.email)],
  ];

  const financialsRows = [
    ['Assessed Value',  mon(deal.assessed_value ?? bj.assessed_value)],
    ['Land Value',      mon(bj.land_value)],
    ['Impr. Value',     mon(bj.improvement_value)],
    ['AVM',             mon(bj.avm)],
    ['Tax Amount',      mon(bj.tax_amount)],
    ['NOI Est.',        mon(bj.noi_est)],
    ['Cap Rate Est.',   pct(bj.cap_rate)],
    ['GRM',             hasVal(bj.grm) ? fmt(bj.grm) : null],
    ['Last Sale Price', mon(deal.last_sale_price)],
    ['Last Sale Date',  fmt(deal.last_sale_date)],
  ];

  const hasLoan = hasVal(bj.loan_amount) || hasVal(bj.lender);
  const loanRows = [
    ['Lender',      fmt(bj.lender)],
    ['Loan Amount', mon(bj.loan_amount)],
    ['Rate',        pct(bj.rate)],
    ['Term',        bj.term ? bj.term + ' mo' : null],
    ['Loan Due',    fmt(bj.due)],
  ];

  const siteRows = [
    ['Lot Sq Ft',      sf(deal.lot_sf ?? bj.lot_sf)],
    ['Lot Acres',      bj.lot_ac ? bj.lot_ac + ' ac' : null],
    ['Building Sq Ft', sf(deal.building_sf)],
    ['Stories',        fmt(deal.stories)],
    ['Units',          fmt(deal.units)],
    ['Parking',        fmt(bj.parking_spaces)],
    ['Construction',   fmt(bj.construction_type)],
    ['Yr Renovated',   fmt(bj.year_renovated)],
  ];

  const zoningRows = [
    ['Zoning Code',  fmt(deal.zoning)],
    ['Jurisdiction', fmt(deal.city_jurisdiction)],
    ['In ETJ',       deal.in_etj != null ? (deal.in_etj ? 'Yes' : 'No') : null],
    ['ETJ City',     fmt(deal.etj_city)],
  ];

  const contextRows = [
    ['Submarket',    fmt(deal.submarket)],
    ['MSA',          fmt(deal.msa)],
    ['County',       fmt(deal.county)],
    ['FIPS',         fmt(deal.fips)],
    ['Census Tract', fmt(deal.census_tract ?? bj.censusTract)],
    ['Latitude',     deal.lat ? deal.lat.toFixed(6) : null],
    ['Longitude',    deal.lng ? deal.lng.toFixed(6) : null],
  ];

  const riskRows = [
    ['Distress Score',  hasVal(score) ? String(Math.round(parseFloat(score))) : null],
    ['Distress Tier',   fmt(deal.distress_tier)],
    ['Tax Delinquent',  fmt(deal.tax_delinquent)],
    ['Liens',           fmt(deal.liens)],
    ['Code Violations', fmt(deal.code_violations)],
    ['Vacancy Est.',    fmt(deal.vacancy_est)],
  ];

  const dealIntelRows = [
    ['Match Score', hasVal(deal.match_score) ? String(deal.match_score) : null],
    ['Buy Box',     fmt(deal.buy_box_name)],
    ['Status',      fmt(deal.status)],
    ['Deal State',  fmt(deal.deal_state)],
    ['Days Active', hasVal(deal.days) ? String(deal.days) + ' days' : null],
    ['Feedback',    fmt(deal.feedback)],
    ['Source',      fmt(deal.source)],
    ['Enriched',    fmt(enriched)],
  ];

  const salesHistory = Array.isArray(bj.sales_history) ? bj.sales_history : [];

  const metrics = [
    { label: 'Assessed Value', value: mon(deal.assessed_value ?? bj.assessed_value) },
    { label: 'Lot Size',       value: sf(deal.lot_sf ?? bj.lot_sf) || (bj.lot_ac ? bj.lot_ac + ' ac' : null) },
    { label: 'Year Built',     value: fmt(deal.year_built) },
    { label: 'Hold Period',    value: bj.hold_years ? bj.hold_years + ' yrs' : null },
    { label: 'Owner Distance', value: ownerDistanceCell() },
  ];

  return (
    <div className="dd-root">
      <div className="dd-nav-band" />

      <div className="dd-sticky-header">
        <div className="dd-addr-bar">
          <div className="dd-addr-identity">
            <span className="dd-addr-line1">{deal.address || 'Unknown Address'}</span>
            {line2Parts.length > 0 && (
              <span className="dd-addr-line2">{line2Parts.join(' · ')}</span>
            )}
            {onClose && (
              <button className="dd-addr-back" onClick={onClose}>← Back to deals</button>
            )}
          </div>
          <div className="dd-addr-divider" />
          <div className="dd-addr-metrics">
            {metrics.map(m => (
              <div key={m.label} className="dd-addr-metric-cell">
                <span className="dd-addr-metric-label">{m.label}</span>
                <span className="dd-addr-metric-value">{m.value || '—'}</span>
              </div>
            ))}
          </div>
          <div className="dd-addr-divider" />
          <div className="dd-addr-actions">
            <span className={`dd-score-badge ${variant}`}>{scoreLabel}</span>
            <button className="dd-btn primary" onClick={handleMarkHot} disabled={hotLoading}>
              {deal.feedback === 'hot' ? '★ Hot' : '☆ Mark as Hot'}
            </button>
            <button className="dd-btn outline" onClick={() => postFeedback(deal.id, deal.feedback === 'no' ? null : 'no')}>
              Not Relevant
            </button>
            {onClose && (
              <button className="dd-btn close-btn" onClick={onClose} aria-label="Close">&times;</button>
            )}
          </div>
        </div>

        <div className="dd-subtabs-outer">
          <div className="dd-subtabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`dd-subtab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => scrollToSection(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dd-status-row">
        <div className="dd-status-chip-wrap" ref={statusRef}>
          <button
            className={`dd-status-chip ${statusColor}`}
            onClick={() => setShowStatusDropdown(p => !p)}
          >
            <span className="dd-status-dot" />
            {statusLabel}
            <span className="dd-status-caret">▾</span>
          </button>
          {showStatusDropdown && (
            <div className="dd-status-dropdown">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`dd-status-option ${STATUS_COLORS[s] || 'gray'}${s === currentStatus ? ' active' : ''}`}
                  onClick={() => handleStatusChange(s)}
                >
                  <span className="dd-status-dot" />
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="dd-btn outline dd-contact-btn" onClick={() => setContactModalOpen(true)}>
          📞 Log Contact
        </button>
      </div>

      <div className="dd-discovery-panel">
        <div className="dd-discovery-left">
          <span className="dd-discovery-eyebrow">AI Property Brief</span>
          <p className={`dd-discovery-narrative${bj.narrative ? '' : ' dd-discovery-narrative--empty'}`}>
            {bj.narrative || 'No summary narrative available for this property.'}
          </p>
          {(signals.length > 0 || deal.absentee_owner) && (
            <div className="dd-discovery-signals">
              {deal.absentee_owner && (
                <span className="dd-signal-pill amber">Absentee Owner</span>
              )}
              {signals.map((sig, i) => (
                <span key={i} className={`dd-signal-pill ${signalColor(sig)}`}>
                  {sig.label || sig.description || sig.type || String(sig)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="dd-discovery-right">
          <div className="dd-discovery-image">
            <AerialThumb id={deal.id} lat={deal.lat} lng={deal.lng} large={true} showParcel={false} />
          </div>
        </div>
      </div>

      <div className="dd-body" style={{ flex: 1 }}>

        <div className="dd-cols">
          {/* LEFT COLUMN: Property Record → Ownership → Financials → Capital Stack → Transactions */}
          <div className="dd-col">

            <div id="dd-property" className="dd-sec">
              <SecHead title="Property Record" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={propertyRows} />
                <p className="dd-sec-source">Source: Parcyl Data · County Assessor Records</p>
              </div>
            </div>

            <div id="dd-ownership" className="dd-sec">
              <SecHead title="Ownership &amp; Skip Trace" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={ownershipRows} />
                {(bj.dm?.phoneConf || bj.dm?.emailConf) && (
                  <div className="dd-conf-row">
                    {bj.dm?.phoneConf && <span className="dd-conf-label">Phone <ConfBadge conf={bj.dm.phoneConf} /></span>}
                    {bj.dm?.emailConf && <span className="dd-conf-label">Email <ConfBadge conf={bj.dm.emailConf} /></span>}
                  </div>
                )}
                {dealContactList.length > 0 && (
                  <div className="dd-contact-history">
                    <span className="dd-contact-history-label">Contact History</span>
                    <div className="dd-contact-thread">
                      {dealContactList.map((c, i) => (
                        <div key={i} className="dd-contact-entry">
                          <div className="dd-contact-header">
                            <span className="dd-contact-channel">{c.channel}</span>
                            <span className="dd-contact-outcome">{(c.outcome || '').replace(/_/g, ' ')}</span>
                            <span className="dd-contact-date">
                              {c.contacted_at ? new Date(c.contacted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </span>
                          </div>
                          {c.notes && <p className="dd-contact-notes">{c.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="dd-sec-source">Source: Parcyl Skip Trace</p>
              </div>
            </div>

            <div id="dd-financials" className="dd-sec">
              <SecHead title="Financials" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={financialsRows} />
                <p className="dd-sec-source">Source: Parcyl AVM · County Assessor</p>
              </div>
            </div>

            <div id="dd-capital" className="dd-sec">
              <SecHead title="Capital Stack" date={enriched} />
              <div className="dd-sec-body">
                {hasLoan ? (
                  <table className="dd-table">
                    <thead><tr><th>Lender</th><th>Amount</th><th>Rate</th><th>Due</th></tr></thead>
                    <tbody>
                      <tr>
                        <td>{fmt(bj.lender)}</td>
                        <td>{mon(bj.loan_amount)}</td>
                        <td>{pct(bj.rate)}</td>
                        <td className="muted">{fmt(bj.due)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <Rows data={loanRows} />
                )}
                <p className="dd-sec-source">Source: Parcyl Mortgage Data · FFIEC HMDA</p>
              </div>
            </div>

            <div id="dd-transactions" className="dd-sec">
              <SecHead title="Transactions" date={enriched} />
              <div className="dd-sec-body">
                {salesHistory.length > 0 ? (
                  <table className="dd-table">
                    <thead><tr><th>Date</th><th>Price</th><th>Buyer</th><th>Seller</th></tr></thead>
                    <tbody>
                      {salesHistory.map((s, i) => (
                        <tr key={i}>
                          <td>{fmt(s.date ?? s.sale_date)}</td>
                          <td>{mon(s.price ?? s.sale_price)}</td>
                          <td className="muted">{fmt(s.buyer)}</td>
                          <td className="muted">{fmt(s.seller)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (deal.last_sale_date || deal.last_sale_price) ? (
                  <table className="dd-table">
                    <thead><tr><th>Date</th><th>Price</th></tr></thead>
                    <tbody>
                      <tr>
                        <td>{fmt(deal.last_sale_date)}</td>
                        <td>{mon(deal.last_sale_price)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <span style={{ color: 'var(--fg-4)', fontSize: 'var(--t-cap)' }}>No transaction history available</span>
                )}
                <p className="dd-sec-source">Source: Parcyl Data · County Deed Records</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Site & Lot → Zoning → Site Context → Risk → Distress → Deal Intel */}
          <div className="dd-col">

            <div id="dd-site" className="dd-sec">
              <SecHead title="Site &amp; Lot" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={siteRows} />
                <p className="dd-sec-source">Source: Parcyl Data · County GIS</p>
              </div>
            </div>

            <div id="dd-zoning" className="dd-sec">
              <SecHead title="Zoning" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={zoningRows} />
                <p className="dd-sec-source">Source: City/County Zoning Records</p>
              </div>
            </div>

            <div id="dd-context" className="dd-sec">
              <SecHead title="Site Context" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={contextRows} />
                <p className="dd-sec-source">Source: US Census · HUD · CoStar Submarket</p>
              </div>
            </div>

            <div id="dd-risk" className="dd-sec">
              <SecHead title="Risk" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={riskRows} />
                <p className="dd-sec-source">Source: Parcyl Distress Model · County Records</p>
              </div>
            </div>

            <div id="dd-distress" className="dd-sec">
              <SecHead title="Distress Signals" date={enriched} />
              <div className="dd-sec-body">
                {signals.length > 0 ? (
                  <table className="dd-table">
                    <thead><tr><th>Signal</th><th>Type</th><th>Severity</th></tr></thead>
                    <tbody>
                      {signals.map((sig, i) => {
                        const color = signalColor(sig);
                        const dotColor = color === 'red' ? 'red' : color === 'amber' ? 'orange' : 'green';
                        const label = sig.label || sig.description || sig.type || String(sig);
                        const type = (sig.type || sig.category || '').replace(/_/g, ' ') || 'General';
                        return (
                          <tr key={i}>
                            <td>
                              <span className={`dd-signal-dot ${dotColor}`} />
                              {label}
                            </td>
                            <td className="muted" style={{ textTransform: 'capitalize' }}>{type}</td>
                            <td>
                              <Chip color={color === 'red' ? 'red' : color === 'amber' ? 'amber' : 'green'}>
                                {color === 'red' ? 'High' : color === 'amber' ? 'Medium' : 'Low'}
                              </Chip>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <span style={{ color: 'var(--fg-4)', fontSize: 'var(--t-cap)' }}>No distress signals recorded</span>
                )}
                <p className="dd-sec-source">Source: Parcyl AI · County Lien Records · Tax Assessor</p>
              </div>
            </div>

            <div id="dd-dealintel" className="dd-sec">
              <SecHead title="Deal Intel" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={dealIntelRows} />
                <p className="dd-sec-source">Source: Parcyl Deal Engine</p>
              </div>
            </div>

          </div>

          {/* IMAGE SIDEBAR */}
          {(deal.lat && deal.lng) && (
            <div className="dd-img-sidebar">
              <div className="dd-img-thumb">
                <AerialThumb id={deal.id} lat={deal.lat} lng={deal.lng} large={true} />
                <span className="dd-img-thumb-label">Satellite</span>
              </div>
              <div className="dd-img-thumb">
                <AerialThumb id={deal.id} lat={deal.lat} lng={deal.lng} showParcel={true} />
                <span className="dd-img-thumb-label">Parcel</span>
              </div>
              <div className="dd-sidebar-links">
                <button className="dd-sidebar-link" onClick={() => scrollToSection('property')}>Property Record</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('ownership')}>Ownership</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('financials')}>Financials</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('capital')}>Capital Stack</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('transactions')}>Transactions</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('site')}>Site &amp; Lot</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('zoning')}>Zoning</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('distress')}>Distress</button>
                <button className="dd-sidebar-link" onClick={() => scrollToSection('dealintel')}>Deal Intel</button>
              </div>
            </div>
          )}
        </div>

        <div className="dd-footer-bar">
          <span>
            Data sourced from Parcyl, County Records, and public data.
            All values are estimates and should be independently verified.
          </span>
          <span className="dd-footer-right">
            Parcyl · {deal.address || 'Deal Detail'} · {enriched ? `Updated ${fmt(enriched)}` : 'Live Data'}
          </span>
        </div>

        <div className="dd-sec dd-notes-log">
          <SecHead title="Notes" />
          <div className="dd-sec-body">
            <div className="dd-note-compose">
              <textarea
                className="dd-note-input"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
              />
              <button
                className="dd-btn primary dd-add-note-btn"
                onClick={handleAddNote}
                disabled={noteSaving || !noteInput.trim()}
              >
                {noteSaving ? 'Saving…' : 'Add Note'}
              </button>
            </div>
            {dealNotesList.length > 0 && (
              <div className="dd-notes-thread">
                {dealNotesList.map((n, i) => (
                  <div key={i} className="dd-note-entry">
                    <div className="dd-note-header">
                      <span className="dd-note-author">{n.author_name || 'You'}</span>
                      <span className="dd-note-date">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <p className="dd-note-text">{n.note_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {deals && deals.length > 1 && onNavigateDeal && (
        <div className="dd-nav-float">
          <button className="dd-deal-nav-btn" onClick={() => onNavigateDeal(deals[dealIndex - 1])} disabled={dealIndex <= 0}>← Prev</button>
          <span className="dd-deal-nav-count">Deal {dealIndex + 1} of {deals.length}</span>
          <button className="dd-deal-nav-btn" onClick={() => onNavigateDeal(deals[dealIndex + 1])} disabled={dealIndex >= deals.length - 1}>Next →</button>
        </div>
      )}

      {contactModalOpen && (
        <ContactLogModal
          onSubmit={handleLogContact}
          onClose={() => setContactModalOpen(false)}
          submitting={contactSubmitting}
        />
      )}
    </div>
  );
}
