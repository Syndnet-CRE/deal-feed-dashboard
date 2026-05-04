import { useState, useMemo, useRef, useEffect } from 'react';
import { I } from './Icons';
import { AerialThumb } from './AerialThumb';
import { fmtMoney, scoreClass, fmt, hasVal, fmtRelativeTime, freshnessColor } from '../lib/format';
import { useDeals } from '../contexts/DealsContext';

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "ownership",  label: "Ownership & Skip" },
  { id: "tx",         label: "Transactions" },
  { id: "tax",        label: "Tax & Assessment" },
  { id: "site",       label: "Site & Environmental" },
  { id: "market",     label: "Market & Comps" },
  { id: "distress",   label: "Distress Signals" },
  { id: "docs",       label: "Documents" },
  { id: "notes",      label: "Notes" },
];

function isValidHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

const SIGNAL_META = {
  "Absentee Owner":     { icon: <I.Pin size={13}/>,      cls: "warn",  desc: "Owner mailing address differs from the property address." },
  "Out-of-State Owner": { icon: <I.External size={13}/>, cls: "warn",  desc: "Owner mail is outside the property state — indicates remote control." },
  "Entity Owner":       { icon: <I.Building size={13}/>, cls: "info",  desc: "Title held in LLC, LP, trust, or other entity structure." },
  "No Permits 5yr":     { icon: <I.Alert size={13}/>,    cls: "hot",   desc: "No building permits pulled in 5+ years — deferred capex signal." },
  "Opportunity Zone":   { icon: <I.Sparkle size={13}/>,  cls: "green", desc: "Parcel is within a federally designated Opportunity Zone." },
};

function ConfidenceGauge({ level }) {
  const labels = ["Very Low", "Low", "Medium", "High", "Very High"];
  return (
    <span className="gauge">
      <span className="gauge-track">
        {[1,2,3,4,5].map(s => <span key={s} className={`gauge-seg ${s <= level ? "on-" + level : ""}`}/>)}
      </span>
      <span className="gauge-label">{labels[level - 1]}</span>
    </span>
  );
}

function enrichDeal(deal) {
  return {
    ...deal,
    apn:           fmt(deal.apn),
    censusTract:   fmt(deal.censusTract),
    submarket:     hasVal(deal.submarket) ? fmt(deal.submarket) : fmt(deal.city),
    sf:            hasVal(deal.sf)        ? Number(deal.sf)        : null,
    yearBuilt:     hasVal(deal.yearBuilt) ? Number(deal.yearBuilt) : null,
    zoning:        fmt(deal.zoning),
    totalAssessed: deal.value,
    parcelOwner:   fmt(deal.owner),
  };
}

function HeaderBar({ subject, isSaved, onSave, onBack }) {
  const cls = scoreClass(subject.score);
  const freshnessDate = subject.briefJson?.enriched_at || subject.updatedAt || subject.created_at;
  const freshness = fmtRelativeTime(freshnessDate);
  return (
    <>
      <div className="pd-back-bar">
        <button className="pd-back" onClick={onBack}>
          <I.Chevron size={12} style={{ transform: "rotate(180deg)" }}/>
          Back to results
        </button>
      </div>
      <div className="pd-header">
        <div className="pd-header-top">
          <div>
            <div className="pd-title-row">
              <h1 className="pd-title">{subject.addr}</h1>
              <span className="pd-title-sep">·</span>
              <span className="pd-neighborhood">{subject.submarket}</span>
            </div>
            <div className="pd-meta-row">
              <span>{subject.city}</span>
              <span>·</span>
              <span>APN <span className="url">{subject.apn}</span></span>
              {subject.censusTract !== "—" && <><span>·</span><span>Tract {subject.censusTract}</span></>}
              <span>·</span>
              <span className="bad bad-amber">{subject.box}</span>
              {freshness && (
                <>
                  <span>·</span>
                  <span style={{ color: freshnessColor(freshness.days), fontSize: 11 }}>Updated {freshness.label}</span>
                </>
              )}
            </div>
          </div>
          <div className="pd-actions">
            <div className="arc-gauge">
              <div className="arc-num" style={{ color: cls === "hi" ? "#1B7A2A" : cls === "md" ? "#B5750E" : "#6E7180" }}>{subject.score}</div>
              <div className="arc-lbl">Distress Score</div>
            </div>
            <div style={{ width: 1, height: 32, background: "var(--hairline)", margin: "0 6px" }}/>
            <button className={`pd-action-btn ${isSaved ? "active" : ""}`} onClick={onSave}>
              {isSaved ? <><I.Check size={13}/>Saved</> : <><I.Plus size={13}/>Save</>}
            </button>
            <button className="pd-action-btn"><I.Phone size={13}/>Skip Trace</button>
            <button className="pd-action-btn"><I.External size={13}/>Share</button>
          </div>
        </div>
        <div className="pd-stat-strip">
          <div className="pd-stat"><div className="num">{subject.acres?.toFixed(2)}<small> ac</small></div><div className="lbl">Lot Size</div></div>
          {subject.sf && <div className="pd-stat"><div className="num">{subject.sf.toLocaleString()}<small> sf</small></div><div className="lbl">Building</div></div>}
          {subject.yearBuilt && <div className="pd-stat"><div className="num">{subject.yearBuilt}</div><div className="lbl">Year Built</div></div>}
          <div className="pd-stat"><div className="num">{fmtMoney(subject.totalAssessed)}</div><div className="lbl">Assessed</div></div>
          <div className="pd-stat"><div className="num">{subject.zoning}</div><div className="lbl">Zoning</div></div>
          {subject.days != null && <div className="pd-stat"><div className="num">{subject.days === 0 ? "Today" : `${subject.days}d`}</div><div className="lbl">Delivered</div></div>}
        </div>
      </div>
    </>
  );
}

function SectionOverview({ subject }) {
  const signals = [
    subject.score >= 80 && { label: "High Distress", cls: "green" },
    subject.fb === "hot" && { label: "Hot", cls: "amber" },
    subject.days === 0 && { label: "New Today", cls: "green" },
    subject.days > 0 && subject.days <= 7 && { label: "New This Week", cls: "green" },
    subject.asset && { label: subject.asset, cls: "gray" },
  ].filter(Boolean);

  const facts = [
    ["Address",    `${subject.addr}, ${subject.city}`],
    ["Asset",      subject.asset],
    ["Lot",        `${subject.acres?.toFixed(2)} ac`],
    ["Assessed",   fmtMoney(subject.value)],
    ["Box",        subject.box],
    ["APN",        subject.apn],
    subject.sf        && ["Building",   `${subject.sf.toLocaleString()} SF`],
    subject.yearBuilt && ["Year Built", subject.yearBuilt],
    ["Zoning",     subject.zoning],
  ].filter(Boolean);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "1 / 1" }}>
          <AerialThumb id={subject.id} lat={subject.lat} lng={subject.lng}/>
        </div>
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {signals.map((s, i) => <span key={i} className={`pill ${s.cls}`}>{s.label}</span>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 24px" }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ borderBottom: "1px solid var(--hairline-soft)", paddingBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {subject.narrative && (
        <div className="ai-card" style={{ marginBottom: 16 }}>
          <div className="ai-head">
            <span className="ai-title"><I.Sparkle size={12}/> Parcyl AI Summary</span>
          </div>
          <div className="ai-body"><p style={{ whiteSpace: "pre-line" }}>{subject.narrative}</p></div>
        </div>
      )}
    </>
  );
}

function SectionOwnership({ subject }) {
  const { dm } = subject;
  const bj = subject.briefJson || {};
  const confLevel = dm ? Math.max(1, Math.min(5, Math.round(dm.conf / 20))) : 3;
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Entity Profile</h3></div>
        <div className="source-label">Source: County Tax Roll</div>
        <div className="kv-grid">
          <span className="k">Recorded Owner</span><span className="v">{fmt(bj.own_name)}</span>
          {hasVal(bj.own_name2) && <><span className="k">Owner 2</span><span className="v">{fmt(bj.own_name2)}</span></>}
          <span className="k">Entity Type</span><span className="v">{fmt(bj.own_entity_type || bj.own_type)}</span>
          {hasVal(bj.own_type_description) && <><span className="k">Ownership Desc</span><span className="v">{fmt(bj.own_type_description)}</span></>}
          <span className="k">Mailing Address</span><span className="v">{fmt(bj.own_mail_address)}</span>
          <span className="k">Absentee</span>
          <span className="v">
            {bj.own_absentee
              ? <span className="pill amber" style={{ fontSize: 10 }}>Yes — Out of Area</span>
              : <span className="pill gray" style={{ fontSize: 10 }}>No</span>}
          </span>
          <span className="k">Owner Occupied</span><span className="v">{bj.own_occupied ? "Yes" : "No"}</span>
          {hasVal(bj.own_transfer_date) && <><span className="k">Last Transfer</span><span className="v">{fmt(bj.own_transfer_date)}</span></>}
          {hasVal(bj.own_deed_name) && <><span className="k">Deed Name</span><span className="v">{fmt(bj.own_deed_name)}</span></>}
          {hasVal(bj.own_trust_description) && <><span className="k">Trust</span><span className="v">{fmt(bj.own_trust_description)}</span></>}
          <span className="k">FIPS</span><span className="v">{subject.fips || "—"}</span>
        </div>
        {subject.signals?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {subject.signals.map(s => <span key={s} className="tag">{s}</span>)}
          </div>
        )}
      </div>

      {dm?.name && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Skip Trace — Principal</h3><span className="upd" style={{ color: "var(--green)" }}>Auto-enriched</span></div>
          <div className="source-label">Source: Decision Maker enrichment · confidence shown per field</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 12px", background: "var(--panel-2)", borderRadius: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--panel-3)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, color: "var(--ink-2)", flexShrink: 0 }}>
              {dm.name?.charAt(0) || "?"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-1)" }}>{dm.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>Principal · <ConfidenceGauge level={confLevel}/></div>
            </div>
          </div>
          <div className="kv-grid">
            <span className="k">Phone</span><span className="v">{dm.phone} <span className="conf-badge">{dm.phoneConf}%</span></span>
            <span className="k">Email</span><span className="v">{dm.email} <span className="conf-badge">{dm.emailConf}%</span></span>
            <span className="k">Match Score</span><span className="v">{dm.conf}%</span>
          </div>
        </div>
      )}

      {(bj.dev_same_owner_parcel_count > 0 || bj.dev_adjacent_parcel_count > 0 || bj.buy_box_fit_score != null) && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Portfolio &amp; Assemblage</h3></div>
          <div className="kv-grid">
            {bj.dev_same_owner_parcel_count > 0 && <><span className="k">Same-Owner Parcels</span><span className="v" style={{ color: "var(--green)" }}>{bj.dev_same_owner_parcel_count} nearby</span></>}
            {bj.dev_adjacent_parcel_count > 0 && <><span className="k">Adjacent Parcels</span><span className="v">{bj.dev_adjacent_parcel_count}</span></>}
            {bj.buy_box_fit_score != null && <><span className="k">Buy-Box Fit Score</span><span className="v">{bj.buy_box_fit_score}</span></>}
          </div>
        </div>
      )}
    </>
  );
}

function SectionTransactions({ subject }) {
  const bj = subject.briefJson || {};
  const sales = bj.sales_history || [];
  const facSales = bj.facility_sales_history || [];
  const allSales = sales.length > 0 ? sales : facSales;
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Current Assessment</h3><span className="upd">{bj.tax_year ? `Tax Roll ${bj.tax_year}` : "Tax Roll"}</span></div>
        <div className="kv-grid">
          <span className="k">Total Assessed</span><span className="v" style={{ color: "var(--green)" }}>{fmtMoney(bj.tax_assessed_total || subject.value)}</span>
          <span className="k">Land Value</span><span className="v">{fmtMoney(bj.tax_assessed_land)}</span>
          <span className="k">Improvement</span><span className="v">{fmtMoney(bj.tax_assessed_improvements)}</span>
          {bj.tax_market_total && <><span className="k">Market Value Est.</span><span className="v">{fmtMoney(bj.tax_market_total)}</span></>}
          <span className="k">Assessment Year</span><span className="v">{fmt(bj.tax_year)}</span>
          <span className="k">GIS Acreage</span><span className="v">{subject.gisAcres?.toFixed(2)} ac</span>
          <span className="k">Recorded Acreage</span><span className="v">{subject.acres?.toFixed(2)} ac</span>
          {bj.tax_prior_sale_date && <><span className="k">Prior Sale Date</span><span className="v">{fmt(bj.tax_prior_sale_date)}</span></>}
          {bj.tax_prior_sale_amount && <><span className="k">Prior Sale Price</span><span className="v">{fmtMoney(bj.tax_prior_sale_amount)}</span></>}
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Transfer History</h3><span className="upd">{allSales.length > 0 ? `${allSales.length} recorded` : "County Deed Records"}</span></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Type</th><th>Grantor</th><th>Grantee</th><th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "right" }}>LTV</th></tr></thead>
            <tbody>
              {allSales.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}>No transfer records in deal data.</td></tr>
                : allSales.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--ink-3)" }}>{s.date || "—"}</td>
                    <td><span className="tag" style={{ fontSize: 10 }}>{s.document_type || s.doc_type || "—"}</span></td>
                    <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt(s.grantor)}</td>
                    <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt(s.grantee)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtMoney(s.price || s.amount)}</td>
                    <td style={{ textAlign: "right", color: "var(--ink-3)" }}>{s.purchase_ltv ? `${s.purchase_ltv}%` : "—"}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Mortgage &amp; Debt</h3><span className="upd">{bj.loan_lender ? "Active loan on record" : "No loan data"}</span></div>
        <div className="kv-grid">
          <span className="k">Loan Amount</span><span className="v">{fmtMoney(bj.loan_amount)}</span>
          <span className="k">Estimated Balance</span><span className="v">{fmtMoney(bj.loan_estimated_balance)}</span>
          <span className="k">Lender</span><span className="v">{fmt(bj.loan_lender)}</span>
          <span className="k">Loan Type</span><span className="v">{fmt(bj.loan_mortgage_type || bj.loan_type)}</span>
          <span className="k">Interest Rate</span><span className="v">{bj.loan_interest_rate ? `${bj.loan_interest_rate}% ${fmt(bj.loan_rate_type)}` : "—"}</span>
          <span className="k">Term</span><span className="v">{bj.loan_term ? `${bj.loan_term} mo` : "—"}</span>
          <span className="k">Due Date</span><span className="v">{fmt(bj.loan_due_date)}</span>
          <span className="k">Monthly Payment</span><span className="v">{fmtMoney(bj.loan_monthly_payment)}</span>
          <span className="k">Recording Date</span><span className="v">{fmt(bj.loan_recording_date)}</span>
          <span className="k">Position</span><span className="v">{fmt(bj.loan_position)}</span>
        </div>
      </div>
    </>
  );
}

function SectionTax({ subject }) {
  const bj = subject.briefJson || {};
  const exemptions = [
    bj.tax_homeowner_exemption && "Homeowner",
    bj.tax_senior_exemption    && "Senior",
    bj.tax_veteran_exemption   && "Veteran",
    bj.tax_disabled_exemption  && "Disabled",
  ].filter(Boolean);
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Tax Assessment</h3><span className="upd">{bj.tax_year ? `${bj.tax_year} Tax Roll` : "Tax Roll"}</span></div>
        <div className="kv-grid">
          <span className="k">Total Assessed</span><span className="v" style={{ color: "var(--green)" }}>{fmtMoney(bj.tax_assessed_total || subject.value)}</span>
          <span className="k">Land Assessed</span><span className="v">{fmtMoney(bj.tax_assessed_land)}</span>
          <span className="k">Improvement Assessed</span><span className="v">{fmtMoney(bj.tax_assessed_improvements)}</span>
          {bj.tax_market_total   && <><span className="k">Market Value (Total)</span><span className="v">{fmtMoney(bj.tax_market_total)}</span></>}
          {bj.tax_market_land    && <><span className="k">Market Value (Land)</span><span className="v">{fmtMoney(bj.tax_market_land)}</span></>}
          {bj.tax_previous_assessed && <><span className="k">Prior Year Assessed</span><span className="v">{fmtMoney(bj.tax_previous_assessed)}</span></>}
          <span className="k">Exemptions</span><span className="v">{exemptions.length > 0 ? exemptions.join(", ") : "None"}</span>
          {hasVal(bj.tax_rate_area) && <><span className="k">Tax Rate Area</span><span className="v">{fmt(bj.tax_rate_area)}</span></>}
          <span className="k">Last Roll Update</span><span className="v">{fmt(bj.tax_last_roll_update)}</span>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Tax Bill</h3></div>
        <div className="kv-grid">
          <span className="k">Annual Tax Billed</span><span className="v">{fmtMoney(bj.tax_amount_billed)}</span>
          <span className="k">Tax Rate</span><span className="v">{bj.tax_rate ? `${(bj.tax_rate * 100).toFixed(4)}%` : "—"}</span>
          <span className="k">Tax Year</span><span className="v">{fmt(bj.tax_year)}</span>
          <span className="k">Fiscal Year</span><span className="v">{fmt(bj.tax_fiscal_year)}</span>
          <span className="k">Delinquent Since</span>
          <span className="v">
            {bj.tax_delinquent_year
              ? <span className="pill amber" style={{ fontSize: 10 }}>{bj.tax_delinquent_year}</span>
              : <span className="pill gray" style={{ fontSize: 10 }}>None on record</span>}
          </span>
        </div>
      </div>
    </>
  );
}

function ClimateScore({ label, score }) {
  if (score == null) return null;
  const color = score >= 7 ? "#E5484D" : score >= 4 ? "#F4B73E" : "#5BCC48";
  return (
    <>
      <span className="k">{label}</span>
      <span className="v" style={{ color, fontWeight: 700 }}>{score}/10</span>
    </>
  );
}

function SectionSite({ subject }) {
  const bj = subject.briefJson || {};
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Parcel Details</h3></div>
        <div className="kv-grid">
          <span className="k">APN</span><span className="v">{subject.apn}</span>
          {hasVal(bj.apn2) && <><span className="k">APN 2</span><span className="v">{fmt(bj.apn2)}</span></>}
          <span className="k">FIPS</span><span className="v">{subject.fips || "—"}</span>
          <span className="k">Census Tract</span><span className="v">{subject.censusTract}</span>
          {hasVal(bj.census_block) && <><span className="k">Census Block</span><span className="v">{fmt(bj.census_block)}</span></>}
          <span className="k">Lot Acreage</span><span className="v">{subject.acres?.toFixed(2)} ac</span>
          <span className="k">GIS Acreage</span><span className="v">{subject.gisAcres?.toFixed(2)} ac</span>
          {hasVal(bj.bldg_lot_depth) && <><span className="k">Lot Depth</span><span className="v">{bj.bldg_lot_depth} ft</span></>}
          {hasVal(bj.bldg_lot_width) && <><span className="k">Lot Width</span><span className="v">{bj.bldg_lot_width} ft</span></>}
          <span className="k">Zoning</span><span className="v">{subject.zoning}</span>
          {hasVal(bj.gis_zoning_desc) && <><span className="k">Zoning Desc</span><span className="v">{fmt(bj.gis_zoning_desc)}</span></>}
          {hasVal(bj.gis_future_land_use) && <><span className="k">Future Land Use</span><span className="v">{fmt(bj.gis_future_land_use)}</span></>}
          {hasVal(bj.gis_overlay_districts) && <><span className="k">Overlay Districts</span><span className="v">{fmt(bj.gis_overlay_districts)}</span></>}
          <span className="k">Land Use</span><span className="v">{subject.asset}</span>
          {hasVal(bj.legal_subdivision) && <><span className="k">Subdivision</span><span className="v">{fmt(bj.legal_subdivision)}</span></>}
          {hasVal(bj.jurisdiction) && <><span className="k">Jurisdiction</span><span className="v">{fmt(bj.jurisdiction)}</span></>}
          {bj.gis_tif_district && <><span className="k">TIF District</span><span className="v" style={{ color: "var(--green)" }}>{fmt(bj.gis_tif_district)}</span></>}
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Improvements</h3></div>
        <div className="kv-grid">
          {subject.sf && <><span className="k">Building SF</span><span className="v">{subject.sf.toLocaleString()} SF</span></>}
          {subject.yearBuilt && <><span className="k">Year Built</span><span className="v">{subject.yearBuilt}</span></>}
          {hasVal(bj.bldg_construction_type) && <><span className="k">Construction</span><span className="v">{fmt(bj.bldg_construction_type)}</span></>}
          {hasVal(bj.bldg_exterior_walls)    && <><span className="k">Exterior Walls</span><span className="v">{fmt(bj.bldg_exterior_walls)}</span></>}
          {hasVal(bj.bldg_roof_material)     && <><span className="k">Roof</span><span className="v">{fmt(bj.bldg_roof_material)}</span></>}
          {hasVal(bj.bldg_foundation_type)   && <><span className="k">Foundation</span><span className="v">{fmt(bj.bldg_foundation_type)}</span></>}
          {hasVal(bj.bldg_quality_grade)     && <><span className="k">Quality Grade</span><span className="v">{fmt(bj.bldg_quality_grade)}</span></>}
          {hasVal(bj.bldg_condition)         && <><span className="k">Condition</span><span className="v">{fmt(bj.bldg_condition)}</span></>}
          {hasVal(bj.bldg_fire_resistance_class) && <><span className="k">Fire Resistance</span><span className="v">{fmt(bj.bldg_fire_resistance_class)}</span></>}
          {bj.bldg_parking_spaces > 0 && <><span className="k">Parking Spaces</span><span className="v">{bj.bldg_parking_spaces}</span></>}
          {hasVal(bj.bldg_hvac_cooling) && <><span className="k">HVAC Cooling</span><span className="v">{fmt(bj.bldg_hvac_cooling)}</span></>}
          {hasVal(bj.bldg_hvac_heating) && <><span className="k">HVAC Heating</span><span className="v">{fmt(bj.bldg_hvac_heating)}</span></>}
          {bj.bldg_has_elevator         && <><span className="k">Elevator</span><span className="v">Yes</span></>}
          {bj.bldg_has_fire_sprinklers  && <><span className="k">Fire Sprinklers</span><span className="v">Yes</span></>}
          {bj.bldg_has_overhead_door    && <><span className="k">Overhead Door</span><span className="v">Yes</span></>}
          {bj.bldg_has_loading_platform && <><span className="k">Loading Platform</span><span className="v">{bj.bldg_loading_platform_area ? `${bj.bldg_loading_platform_area} SF` : "Yes"}</span></>}
          {bj.bldg_has_canopy           && <><span className="k">Canopy</span><span className="v">{bj.bldg_canopy_area ? `${bj.bldg_canopy_area} SF` : "Yes"}</span></>}
          {hasVal(bj.bldg_view_description)  && <><span className="k">View</span><span className="v">{fmt(bj.bldg_view_description)}</span></>}
          {hasVal(bj.bldg_topography_code)   && <><span className="k">Topography</span><span className="v">{fmt(bj.bldg_topography_code)}</span></>}
          {isValidHttpUrl(bj.intel_website_url) && <><span className="k">Website</span><span className="v"><a href={bj.intel_website_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>{bj.intel_website_url}</a></span></>}
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Utilities &amp; Access</h3></div>
        <div className="kv-grid">
          <span className="k">Water Source</span><span className="v">{fmt(bj.bldg_water_source)}</span>
          <span className="k">Sewage Type</span><span className="v">{fmt(bj.bldg_sewage_type)}</span>
          {hasVal(bj.gis_utility_proximity) && <><span className="k">Utility Proximity</span><span className="v">{fmt(bj.gis_utility_proximity)}</span></>}
          {bj.gis_nearest_water_ft  != null && <><span className="k">Water Line</span><span className="v">{Number(bj.gis_nearest_water_ft).toLocaleString()} ft</span></>}
          {bj.gis_nearest_sewer_ft  != null && <><span className="k">Sewer Line</span><span className="v">{Number(bj.gis_nearest_sewer_ft).toLocaleString()} ft</span></>}
          {bj.gis_nearest_storm_ft  != null && <><span className="k">Storm Drain</span><span className="v">{Number(bj.gis_nearest_storm_ft).toLocaleString()} ft</span></>}
          {hasVal(bj.nearest_road_name) && <><span className="k">Nearest Road</span><span className="v">{fmt(bj.nearest_road_name)}{bj.nearest_road_aadt ? ` · ${Number(bj.nearest_road_aadt).toLocaleString()} AADT` : ""}</span></>}
          {bj.nearest_substation_ft  != null && <><span className="k">Substation</span><span className="v">{Number(bj.nearest_substation_ft).toLocaleString()} ft{hasVal(bj.nearest_substation_name) ? ` · ${bj.nearest_substation_name}` : ""}</span></>}
          {bj.nearest_rail_yard_ft   != null && <><span className="k">Rail Yard</span><span className="v">{Number(bj.nearest_rail_yard_ft).toLocaleString()} ft{hasVal(bj.nearest_rail_yard_name) ? ` · ${bj.nearest_rail_yard_name}` : ""}</span></>}
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Environmental &amp; Flood</h3></div>
        <div className="kv-grid">
          <span className="k">FEMA Flood Zone</span>
          <span className="v">
            {hasVal(bj.gis_flood_zone)
              ? <span className={`pill ${(bj.gis_flood_zone || "").startsWith("A") || (bj.gis_flood_zone || "").startsWith("V") ? "amber" : "gray"}`} style={{ fontSize: 10 }}>{bj.gis_flood_zone}</span>
              : "—"}
          </span>
          <span className="k">In Floodplain</span><span className="v">{bj.gis_in_floodplain ? <span className="pill amber" style={{ fontSize: 10 }}>Yes</span> : "No"}</span>
          <span className="k">In Floodway</span><span className="v">{bj.gis_in_floodway ? <span className="pill amber" style={{ fontSize: 10 }}>Yes</span> : "No"}</span>
          {hasVal(bj.gis_flood_source) && <><span className="k">Flood Source</span><span className="v">{fmt(bj.gis_flood_source)}</span></>}
          <span className="k">Wetlands</span><span className="v">{bj.gis_wetlands ? <span className="pill amber" style={{ fontSize: 10 }}>Present</span> : "No"}</span>
          {hasVal(bj.climate_fema_flood_risk) && <><span className="k">Flood Risk (FEMA)</span><span className="v">{fmt(bj.climate_fema_flood_risk)}</span></>}
          {bj.climate_flood_depth_future != null && <><span className="k">Future Flood Depth</span><span className="v">{bj.climate_flood_depth_future} in</span></>}
        </div>
      </div>

      {(bj.elev_mean != null || bj.elev_slope_pct != null) && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Elevation &amp; Topography</h3></div>
          <div className="kv-grid">
            {bj.elev_mean    != null && <><span className="k">Elevation (Mean)</span><span className="v">{bj.elev_mean} ft</span></>}
            {bj.elev_min     != null && <><span className="k">Elevation (Min)</span><span className="v">{bj.elev_min} ft</span></>}
            {bj.elev_max     != null && <><span className="k">Elevation (Max)</span><span className="v">{bj.elev_max} ft</span></>}
            {bj.elev_slope_pct != null && <><span className="k">Avg Slope</span><span className="v">{bj.elev_slope_pct}%</span></>}
            {hasVal(bj.elev_slope_tier)    && <><span className="k">Slope Tier</span><span className="v">{fmt(bj.elev_slope_tier)}</span></>}
            {bj.elev_grading_score != null && <><span className="k">Grading Score</span><span className="v">{bj.elev_grading_score}/10</span></>}
            {bj.elev_flood_proxy   != null && <><span className="k">Flood Proxy Score</span><span className="v">{bj.elev_flood_proxy}/10</span></>}
          </div>
        </div>
      )}

      {bj.climate_total_risk_score != null && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Climate Risk Scores</h3><span className="upd">1–10 scale · 10 = highest risk</span></div>
          <div className="kv-grid">
            <ClimateScore label="Flood" score={bj.climate_flood_risk_score}/>
            <ClimateScore label="Heat" score={bj.climate_heat_risk_score}/>
            <ClimateScore label="Wind" score={bj.climate_wind_risk_score}/>
            <ClimateScore label="Storm" score={bj.climate_storm_risk_score}/>
            <ClimateScore label="Wildfire" score={bj.climate_wildfire_risk_score}/>
            <ClimateScore label="Drought" score={bj.climate_drought_risk_score}/>
            <ClimateScore label="Air Quality" score={bj.climate_air_quality_score}/>
            <ClimateScore label="Total Risk" score={bj.climate_total_risk_score}/>
          </div>
        </div>
      )}
    </>
  );
}

function SectionMarket({ subject }) {
  const bj = subject.briefJson || {};
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Submarket Context</h3></div>
        <div className="kv-grid">
          <span className="k">Submarket</span><span className="v">{subject.submarket}</span>
          <span className="k">Asset Class</span><span className="v">{subject.asset}</span>
          {bj.median_hh_income    != null && <><span className="k">Median HH Income</span><span className="v">{fmtMoney(bj.median_hh_income)}</span></>}
          {bj.median_home_value   != null && <><span className="k">Median Home Value</span><span className="v">{fmtMoney(bj.median_home_value)}</span></>}
          {bj.median_gross_rent   != null && <><span className="k">Median Gross Rent</span><span className="v">${Number(bj.median_gross_rent).toLocaleString()}/mo</span></>}
          {bj.population_density  != null && <><span className="k">Population Density</span><span className="v">{Number(bj.population_density).toLocaleString()} / sq mi</span></>}
          {bj.pct_renter_occupied != null && <><span className="k">Renter Occupied</span><span className="v">{bj.pct_renter_occupied}%</span></>}
        </div>
      </div>

      {(bj.hud_fmr_1br != null || bj.hud_fmr_2br != null || bj.hud_fmr_3br != null) && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>HUD Fair Market Rents</h3></div>
          <div className="kv-grid">
            {bj.hud_fmr_1br != null && <><span className="k">1 BR FMR</span><span className="v">${Number(bj.hud_fmr_1br).toLocaleString()}/mo</span></>}
            {bj.hud_fmr_2br != null && <><span className="k">2 BR FMR</span><span className="v">${Number(bj.hud_fmr_2br).toLocaleString()}/mo</span></>}
            {bj.hud_fmr_3br != null && <><span className="k">3 BR FMR</span><span className="v">${Number(bj.hud_fmr_3br).toLocaleString()}/mo</span></>}
          </div>
        </div>
      )}

      {(bj.zori_rent_index != null || bj.zori_yoy_change != null) && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Rent Index (ZORI)</h3></div>
          <div className="kv-grid">
            {bj.zori_rent_index  != null && <><span className="k">ZORI Index</span><span className="v">${Number(bj.zori_rent_index).toLocaleString()}/mo</span></>}
            {bj.zori_yoy_change  != null && (
              <>
                <span className="k">YoY Change</span>
                <span className="v" style={{ color: bj.zori_yoy_change >= 0 ? "var(--green)" : "var(--danger)", fontWeight: 600 }}>
                  {bj.zori_yoy_change >= 0 ? "+" : ""}{bj.zori_yoy_change}%
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {(bj.comp_value_indication != null || bj.comp_confidence_grade) && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Comp Value Indication</h3></div>
          <div className="kv-grid">
            {bj.comp_value_indication  != null && <><span className="k">Value Indication</span><span className="v" style={{ fontWeight: 700, color: "var(--green)" }}>{fmtMoney(bj.comp_value_indication)}</span></>}
            {bj.comp_confidence_score  != null && <><span className="k">Confidence Score</span><span className="v">{bj.comp_confidence_score}/100</span></>}
            {hasVal(bj.comp_confidence_grade) && <><span className="k">Confidence Grade</span><span className="v"><span className={`pill ${bj.comp_confidence_grade === "A" ? "green" : bj.comp_confidence_grade === "B" ? "amber" : "gray"}`} style={{ fontSize: 10 }}>{bj.comp_confidence_grade}</span></span></>}
            {bj.comp_cov               != null && <><span className="k">Coeff of Variation</span><span className="v">{bj.comp_cov}%</span></>}
          </div>
        </div>
      )}

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Comparable Sales</h3><span className="upd">{(bj.comps || []).length > 0 ? `${bj.comps.length} comps` : "No comps"}</span></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Address</th><th>Type</th><th>Date</th><th>Price</th><th>Bldg SF</th><th>Dist</th><th>Sim</th></tr>
            </thead>
            <tbody>
              {(bj.comps || []).length === 0
                ? <tr><td colSpan={7} style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}>No comparable sales in deal data.</td></tr>
                : (bj.comps).map((c, i) => (
                  <tr key={i}>
                    <td>{c.addr}</td>
                    <td><span className="tag" style={{ fontSize: 10.5 }}>{c.type}</span></td>
                    <td style={{ color: "var(--ink-3)" }}>{c.date}</td>
                    <td style={{ fontWeight: 600 }}>{fmtMoney(c.price)}</td>
                    <td style={{ color: "var(--ink-3)" }}>{c.sf != null && isFinite(Number(c.sf)) ? Number(c.sf).toLocaleString() : "—"}</td>
                    <td style={{ color: "var(--ink-3)" }}>{c.dist || "—"}</td>
                    <td>{c.sim != null ? <span className={`pill ${c.sim >= 85 ? "green" : c.sim >= 75 ? "amber" : "gray"}`} style={{ fontSize: 10 }}>{c.sim}%</span> : "—"}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SectionDistress({ subject }) {
  const bj = subject.briefJson || {};
  const signals = subject.signals || [];
  const ddFlags = bj.dd_flags || [];
  const permits = bj.permit_history || [];
  const hasForeclosure = hasVal(bj.foreclosure_status);
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head">
          <h3>Distress Score</h3>
          <span style={{ fontSize: 18, fontWeight: 800, color: subject.score >= 75 ? "#1B7A2A" : subject.score >= 50 ? "#B5750E" : "var(--ink-3)" }}>
            {subject.score}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 10 }}>
          Score reflects owner motivation, hold duration, capital activity, and entity signals. Range 0–100.
        </div>
        <div style={{ height: 8, background: "var(--panel-3)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${subject.score}%`, background: subject.score >= 75 ? "var(--green)" : subject.score >= 50 ? "var(--warning)" : "var(--ink-4)", borderRadius: 4 }}/>
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Active Signals</h3><span className="upd">{signals.length} flagged</span></div>
        {signals.length === 0
          ? <div style={{ padding: "16px 0", color: "var(--ink-3)", fontSize: 13 }}>No distress signals detected for this parcel.</div>
          : signals.map(s => {
            const meta = SIGNAL_META[s] || { icon: <I.Alert size={13}/>, cls: "warn", desc: "Distress indicator flagged for this parcel." };
            return (
              <div key={s} className="signal-row">
                <div className={`signal-icon ${meta.cls}`}>{meta.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-1)" }}>{s}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{meta.desc}</div>
                </div>
              </div>
            );
          })
        }
      </div>

      {ddFlags.length > 0 && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Due Diligence Flags</h3><span className="upd">{ddFlags.length} flagged</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
            {ddFlags.map((flag, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span style={{ color: "var(--warning)", flexShrink: 0 }}><I.Alert size={13}/></span>
                <span style={{ color: "var(--ink-1)" }}>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Foreclosure Detail</h3></div>
        {!hasForeclosure
          ? <div style={{ padding: "16px 0", color: "var(--ink-3)", fontSize: 13 }}>No active foreclosure on record.</div>
          : (
            <div className="kv-grid">
              <span className="k">Status</span>
              <span className="v"><span className="pill amber" style={{ fontSize: 10 }}>{bj.foreclosure_status}</span></span>
              {hasVal(bj.foreclosure_case_number)   && <><span className="k">Case #</span><span className="v">{fmt(bj.foreclosure_case_number)}</span></>}
              {hasVal(bj.foreclosure_borrower)      && <><span className="k">Borrower</span><span className="v">{fmt(bj.foreclosure_borrower)}</span></>}
              {hasVal(bj.foreclosure_lender)        && <><span className="k">Lender</span><span className="v">{fmt(bj.foreclosure_lender)}</span></>}
              {bj.foreclosure_original_loan  != null && <><span className="k">Original Loan</span><span className="v">{fmtMoney(bj.foreclosure_original_loan)}</span></>}
              {bj.foreclosure_loan_balance   != null && <><span className="k">Loan Balance</span><span className="v">{fmtMoney(bj.foreclosure_loan_balance)}</span></>}
              {bj.foreclosure_default_amount != null && <><span className="k">Default Amount</span><span className="v" style={{ color: "var(--danger)", fontWeight: 600 }}>{fmtMoney(bj.foreclosure_default_amount)}</span></>}
              {bj.foreclosure_opening_bid    != null && <><span className="k">Opening Bid</span><span className="v">{fmtMoney(bj.foreclosure_opening_bid)}</span></>}
              {hasVal(bj.foreclosure_nod_date)      && <><span className="k">NOD Filed</span><span className="v">{fmt(bj.foreclosure_nod_date)}</span></>}
              {hasVal(bj.foreclosure_nos_date)      && <><span className="k">NOS Filed</span><span className="v">{fmt(bj.foreclosure_nos_date)}</span></>}
              {hasVal(bj.foreclosure_auction_date)  && <><span className="k">Auction Date</span><span className="v" style={{ color: "var(--warning)", fontWeight: 600 }}>{fmt(bj.foreclosure_auction_date)}</span></>}
            </div>
          )
        }
      </div>

      <div className="pd-section">
        <div className="pd-sec-head">
          <h3>Permit Activity</h3>
          {bj.permit_count_5yr != null && <span className="upd">{bj.permit_count_5yr} permits (5yr)</span>}
        </div>
        {permits.length === 0
          ? <div style={{ padding: "14px 0", color: "var(--ink-3)", fontSize: 13 }}>No permit history on record.</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Description</th><th>Status</th><th>Job Value</th></tr>
                </thead>
                <tbody>
                  {permits.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--ink-3)" }}>{p.date || "—"}</td>
                      <td>{p.type || "—"}</td>
                      <td style={{ color: "var(--ink-3)" }}>{p.desc || "—"}</td>
                      <td><span className="tag" style={{ fontSize: 10.5 }}>{p.status || "—"}</span></td>
                      <td style={{ fontWeight: 600 }}>{p.job_value ? fmtMoney(p.job_value) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Additional Checks</h3></div>
        <div className="kv-grid">
          <span className="k">NOD Filed</span>
          <span className="v">{hasVal(bj.foreclosure_nod_date) ? <span className="pill amber" style={{ fontSize: 10 }}>{bj.foreclosure_nod_date}</span> : "None on record"}</span>
          <span className="k">Foreclosure</span>
          <span className="v">{hasVal(bj.foreclosure_status) ? <span className="pill amber" style={{ fontSize: 10 }}>{bj.foreclosure_status}</span> : "None on record"}</span>
          <span className="k">Open Permits</span>
          <span className="v">{bj.permit_count_5yr != null ? bj.permit_count_5yr : "—"}</span>
          <span className="k">Tax Delinquent</span>
          <span className="v">{hasVal(bj.tax_delinquent_year) ? <span className="pill amber" style={{ fontSize: 10 }}>Since {bj.tax_delinquent_year}</span> : "None on record"}</span>
          <span className="k">Flood Risk</span>
          <span className="v">{hasVal(bj.climate_fema_flood_risk) ? fmt(bj.climate_fema_flood_risk) : hasVal(bj.gis_flood_zone) ? fmt(bj.gis_flood_zone) : "—"}</span>
          <span className="k">In Floodplain</span>
          <span className="v">{bj.gis_in_floodplain ? <span className="pill amber" style={{ fontSize: 10 }}>Yes</span> : "No"}</span>
        </div>
      </div>
    </>
  );
}

function SectionDocs() {
  return (
    <div className="pd-section">
      <div className="pd-sec-head"><h3>Documents</h3></div>
      <div className="doc-empty">
        <I.External size={22} style={{ opacity: 0.3, marginBottom: 10 }}/>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>No documents yet</div>
        <div style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>Upload deeds, inspections, Phase I reports, or due-diligence files.</div>
        <button className="btn sm"><I.Plus size={12}/> Upload File</button>
      </div>
    </div>
  );
}

function SectionNotes({ subject }) {
  const { saveNote } = useDeals();
  const [note, setNote] = useState(subject.notes || "");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSavedOk(false);
    try {
      await saveNote(subject.id, note);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pd-section">
      <div className="pd-sec-head">
        <h3>Deal Notes</h3>
        {note.length > 0 && <span className="upd">{note.length} chars</span>}
      </div>
      <textarea
        className="note-textarea"
        placeholder="Add notes — comps context, owner conversations, site observations, follow-up reminders…"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button className="btn sm primary" disabled={!note.trim() || saving} onClick={handleSave}>
          {saving ? "Saving…" : savedOk ? "Saved" : "Save Note"}
        </button>
        {note.length > 0 && <button className="btn sm" onClick={() => setNote("")}>Clear</button>}
      </div>
    </div>
  );
}

function RailFit({ subject }) {
  const items = [
    ["Asset Class", subject.asset,                     true],
    ["Geography",   subject.city,                      true],
    ["Lot Size",    subject.acres != null ? `${subject.acres.toFixed(2)} ac` : "—", subject.acres != null && subject.acres >= 1],
    ["Score",       `${subject.score} / 100`,          subject.score >= 75],
    ["Box",         subject.box,                       true],
  ];
  const pct = Math.round((items.filter(i => i[2]).length / items.length) * 100);
  return (
    <div className="pd-section" style={{ padding: "12px 14px" }}>
      <div className="pd-sec-head" style={{ marginBottom: 6 }}>
        <h3 style={{ fontSize: 12 }}>Buy-Box Fit</h3>
        <span className="upd"><b style={{ color: "var(--green-deep)" }}>{pct}%</b></span>
      </div>
      {items.map((it, i) => (
        <div key={i} className="fit-row">
          <span className="k">{it[0]}</span>
          <span className="v" style={{ color: it[2] ? "var(--ink-1)" : "var(--amber)" }}>
            {it[1]}
            {it[2] ? <I.Check size={12} style={{ color: "var(--green)" }}/> : <I.Alert size={12}/>}
          </span>
        </div>
      ))}
    </div>
  );
}

function RailDataQuality() {
  const items = [
    ["Owner Chain",   5],
    ["Tax Roll",      5],
    ["GIS Verified",  5],
    ["Skip Trace",    4],
    ["Capital Stack", 4],
    ["Environmental", 3],
  ];
  return (
    <div className="pd-section" style={{ padding: "12px 14px" }}>
      <div className="pd-sec-head" style={{ marginBottom: 6 }}>
        <h3 style={{ fontSize: 12 }}>Data Quality</h3>
        <span className="upd">6 sources</span>
      </div>
      {items.map((it, i) => (
        <div key={i} className="fit-row">
          <span className="k">{it[0]}</span>
          <span className="v"><ConfidenceGauge level={it[1]}/></span>
        </div>
      ))}
    </div>
  );
}

function RailNextSteps() {
  const steps = [
    "Verify ownership via county assessor",
    "Run skip trace on LLC principals",
    "Pull comparable sales in 1-mile radius",
    "Check for open permits or liens",
    "Draft direct mail outreach",
  ];
  return (
    <div className="pd-section" style={{ padding: "12px 14px" }}>
      <div className="pd-sec-head" style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: 12 }}>Recommended Next Steps</h3>
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1fr", gap: 8, padding: "8px 0", borderTop: i === 0 ? 0 : "1px dotted var(--hairline-soft)" }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--panel-3)", color: "var(--ink-2)", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center" }}>{i + 1}</span>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-1)" }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

function TabContent({ tab, subject }) {
  if (tab === "overview")  return <SectionOverview   subject={subject}/>;
  if (tab === "ownership") return <SectionOwnership  subject={subject}/>;
  if (tab === "tx")        return <SectionTransactions subject={subject}/>;
  if (tab === "tax")       return <SectionTax        subject={subject}/>;
  if (tab === "site")      return <SectionSite       subject={subject}/>;
  if (tab === "market")    return <SectionMarket     subject={subject}/>;
  if (tab === "distress")  return <SectionDistress   subject={subject}/>;
  if (tab === "docs")      return <SectionDocs/>;
  if (tab === "notes")     return <SectionNotes      subject={subject}/>;
  return null;
}

export function PropertyDetail({ deal, onClose }) {
  const [tab, setTab] = useState("overview");
  const [saved, setSaved] = useState(deal?.fb === "hot");
  const subject = useMemo(() => enrichDeal(deal), [deal]);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [tab]);

  if (!deal) return null;

  return (
    <div className="pd-shell" data-screen-label="Property Detail">
      <HeaderBar subject={subject} isSaved={saved} onSave={() => setSaved(s => !s)} onBack={onClose}/>
      <div className="pd-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`pd-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="pd-body">
        <div className="pd-scroll" ref={bodyRef}>
          <div className="pd-main"><TabContent tab={tab} subject={subject}/></div>
          <div className="pd-footer">
            <span>Parcyl Deal Feed · All public records</span>
          </div>
        </div>
        <aside className="pd-rail">
          <RailFit subject={subject}/>
          <RailDataQuality/>
          <RailNextSteps/>
        </aside>
      </div>
    </div>
  );
}
