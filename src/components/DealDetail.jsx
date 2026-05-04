import { Fragment, useState } from 'react';
import { AerialThumb } from './AerialThumb.jsx';
import { fmt, fmtMoney, hasVal } from '../lib/format.js';
import { useDeals } from '../contexts/DealsContext.jsx';
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

function nv(v) {
  if (v === null || v === undefined || v === '' || v === 'null' || v === 'undefined') return null;
  return v;
}

function pct(v) {
  if (!hasVal(v)) return null;
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return (n * 100).toFixed(1) + '%';
}

function mon(v) {
  if (!hasVal(v)) return null;
  return fmtMoney(v);
}

function sf(v) {
  if (!hasVal(v)) return null;
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return n.toLocaleString() + ' sf';
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
      {date && <span className="dd-sec-updated">Updated {fmt(date)}</span>}
    </div>
  );
}

export function DealDetail({ deal, onClose }) {
  const { postFeedback } = useDeals();
  const [activeTab, setActiveTab] = useState('summary');
  const [hotLoading, setHotLoading] = useState(false);

  const bj = deal.briefJson || deal.brief_json || {};
  const enriched = bj.enriched_at || deal.updated_at;

  function scrollToSection(id) {
    setActiveTab(id);
    const el = document.getElementById('dd-' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleMarkHot() {
    setHotLoading(true);
    try {
      const next = deal.feedback === 'hot' ? null : 'hot';
      await postFeedback(deal.id, next);
    } finally {
      setHotLoading(false);
    }
  }

  const score = deal.distress_score ?? deal.score;
  const variant = scoreVariant(score);
  const scoreLabel = hasVal(score) ? `Score ${Math.round(parseFloat(score))}` : 'No Score';

  const city = [deal.city, deal.state].filter(Boolean).join(', ');
  const cityMsa = [city, deal.msa].filter(Boolean).join(' · ');
  const line2Parts = [cityMsa, deal.asset_class || deal.use_type].filter(Boolean);

  const heroFields = [
    { label: 'Assessed Value', num: mon(deal.assessed_value ?? bj.assessed_value), sub: null },
    { label: 'Last Sale Price', num: mon(deal.last_sale_price), sub: deal.last_sale_date ? fmt(deal.last_sale_date) : null },
    { label: 'Lot Size', num: sf(deal.lot_sf ?? bj.lot_sf), sub: bj.lot_ac ? bj.lot_ac + ' ac' : null },
    { label: 'Year Built', num: fmt(deal.year_built), sub: bj.year_renovated ? 'Reno ' + bj.year_renovated : null },
    { label: 'Hold Period', num: bj.hold_years ? bj.hold_years + ' yrs' : null, sub: null },
  ];

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
    ['Submarket', fmt(deal.submarket)],
    ['MSA',       fmt(deal.msa)],
    ['County',    fmt(deal.county)],
    ['Latitude',  deal.lat ? deal.lat.toFixed(6) : null],
    ['Longitude', deal.lng ? deal.lng.toFixed(6) : null],
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
    ['Feedback',    fmt(deal.feedback)],
    ['Source',      fmt(deal.source)],
    ['Enriched',    fmt(enriched)],
  ];

  const signals = bj.distress_signals || deal.signals || [];

  function signalColor(sig) {
    const t = (sig.type || sig.category || '').toLowerCase();
    if (t.includes('tax') || t.includes('lien') || t.includes('delinq') || t.includes('forecl')) return 'red';
    if (t.includes('vacan') || t.includes('code') || t.includes('rising')) return 'amber';
    return 'green';
  }

  const salesHistory = Array.isArray(bj.sales_history) ? bj.sales_history : [];

  return (
    <div className="dd-root">
      <div className="dd-nav-band" />

      <div className="dd-addr-bar">
        <span className="dd-wordmark">Deal Feed</span>
        <div className="dd-addr-divider" />
        <div className="dd-addr-identity">
          <span className="dd-addr-line1">{deal.address || 'Unknown Address'}</span>
          {line2Parts.length > 0 && (
            <span className="dd-addr-line2">{line2Parts.join(' · ')}</span>
          )}
        </div>
        <div className="dd-addr-actions">
          <span className={`dd-score-badge ${variant}`}>{scoreLabel}</span>
          <button className="dd-btn primary" onClick={handleMarkHot} disabled={hotLoading}>
            {deal.feedback === 'hot' ? '★ Hot' : '☆ Mark as Hot'}
          </button>
          <button
            className="dd-btn outline"
            onClick={() => postFeedback(deal.id, deal.feedback === 'no' ? null : 'no')}
          >
            Not Relevant
          </button>
          {onClose && (
            <button className="dd-btn close-btn" onClick={onClose} aria-label="Close">&times;</button>
          )}
        </div>
      </div>

      <div className="dd-hero">
        {heroFields.map((f) => (
          <div key={f.label} className="dd-hero-cell">
            <span className="dd-hero-label">{f.label}</span>
            <span className="dd-hero-num">{f.num || '—'}</span>
            {f.sub && <span className="dd-hero-sub">{f.sub}</span>}
          </div>
        ))}
      </div>

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

      <div className="dd-body">

        <div id="dd-summary" className="dd-sec">
          <SecHead title="Summary" date={enriched} />
          <div className="dd-sec-body">
            <div className="dd-summary-grid">
              <p className="dd-narrative">
                {bj.narrative || 'No summary narrative available for this property.'}
              </p>
              <Rows data={[
                ['Owner',         fmt(deal.owner_name)],
                ['Asset Class',   fmt(deal.asset_class)],
                ['Last Sale',     [mon(deal.last_sale_price), fmt(deal.last_sale_date)].filter(Boolean).join(' · ')],
                ['Assessed',      mon(deal.assessed_value ?? bj.assessed_value)],
                ['Tax / Year',    mon(bj.tax_amount)],
                ['Lender',        fmt(bj.lender)],
                ['Loan',          mon(bj.loan_amount)],
                ['Distress Tier', fmt(deal.distress_tier)],
              ]} />
            </div>
          </div>
        </div>

        <div className="dd-cols">

          <div className="dd-col">

            <div id="dd-property" className="dd-sec">
              <SecHead title="Property Record" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={propertyRows} />
              </div>
            </div>

            <div id="dd-ownership" className="dd-sec">
              <SecHead title="Ownership" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={ownershipRows} />
              </div>
            </div>

            <div id="dd-financials" className="dd-sec">
              <SecHead title="Financials" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={financialsRows} />
              </div>
            </div>

            <div id="dd-capital" className="dd-sec">
              <SecHead title="Capital Stack" date={enriched} />
              <div className="dd-sec-body">
                {hasLoan ? (
                  <table className="dd-table">
                    <thead>
                      <tr>
                        <th>Lender</th>
                        <th>Amount</th>
                        <th>Rate</th>
                        <th>Due</th>
                      </tr>
                    </thead>
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
              </div>
            </div>

            <div id="dd-transactions" className="dd-sec">
              <SecHead title="Transactions" date={enriched} />
              <div className="dd-sec-body">
                {salesHistory.length > 0 ? (
                  <table className="dd-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Price</th>
                        <th>Buyer</th>
                        <th>Seller</th>
                      </tr>
                    </thead>
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
                    <thead>
                      <tr><th>Date</th><th>Price</th></tr>
                    </thead>
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
              </div>
            </div>

          </div>

          <div className="dd-col">

            <div id="dd-site" className="dd-sec">
              <SecHead title="Site &amp; Lot" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={siteRows} />
                {(deal.lat && deal.lng) && (
                  <div className="dd-aerial-wrap">
                    <AerialThumb id={deal.id} lat={deal.lat} lng={deal.lng} large={true} />
                  </div>
                )}
              </div>
            </div>

            <div id="dd-zoning" className="dd-sec">
              <SecHead title="Zoning" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={zoningRows} />
              </div>
            </div>

            <div id="dd-context" className="dd-sec">
              <SecHead title="Site Context" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={contextRows} />
              </div>
            </div>

            <div id="dd-risk" className="dd-sec">
              <SecHead title="Risk" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={riskRows} />
              </div>
            </div>

            <div id="dd-distress" className="dd-sec">
              <SecHead title="Distress Signals" date={enriched} />
              <div className="dd-sec-body">
                {signals.length > 0 ? (
                  <div className="dd-signals">
                    {signals.map((sig, i) => (
                      <div key={i} className={`dd-signal ${signalColor(sig)}`}>
                        <span className="dd-signal-icon">
                          {signalColor(sig) === 'red' ? '⚠' : signalColor(sig) === 'amber' ? '⚡' : '✓'}
                        </span>
                        <span>{sig.label || sig.description || sig.type || String(sig)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--fg-4)', fontSize: 'var(--t-cap)' }}>No distress signals recorded</span>
                )}
              </div>
            </div>

            <div id="dd-dealintel" className="dd-sec">
              <SecHead title="Deal Intel" date={enriched} />
              <div className="dd-sec-body">
                <Rows data={dealIntelRows} />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
