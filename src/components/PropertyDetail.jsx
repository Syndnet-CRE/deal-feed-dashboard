import { useState, useMemo, useRef, useEffect } from 'react';
import { I } from './Icons';
import { AerialThumb } from './AerialThumb';
import { fmtMoney, scoreClass, fmt, hasVal, fmtRelativeTime, freshnessColor } from '../lib/format';
import { useDeals } from '../contexts/DealsContext';
import { OwnershipTab, ConfidenceGauge } from './tabs/OwnershipTab';
import { DistressTab } from './tabs/DistressTab';
import { SiteTab } from './tabs/SiteTab';
import { MarketTab } from './tabs/MarketTab';
import { ContactLogModal } from './ContactLogModal';
import { StatusSelector } from './StatusSelector';

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // clipboard unavailable (non-HTTPS or permission denied) — no-op
    }
  }
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
            <button className="pd-action-btn" onClick={handleShare}>
              {copied ? <><I.Check size={13}/>Copied!</> : <><I.External size={13}/>Share</>}
            </button>
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
  const { updateStatus } = useDeals();
  const [localStatus, setLocalStatus] = useState(subject.status || 'new');

  function handleStatusChange(s) {
    setLocalStatus(s);
    updateStatus(subject.id, s);
  }

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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 16 }}>
            {signals.map((s, i) => <span key={i} className={`pill ${s.cls}`}>{s.label}</span>)}
            <StatusSelector status={localStatus} onChangeStatus={handleStatusChange} size="sm"/>
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

function TabContent({ tab, subject, contacts, onLogContact }) {
  if (tab === "overview")  return <SectionOverview   subject={subject}/>;
  if (tab === "ownership") return <OwnershipTab       deal={subject} contacts={contacts} onLogContact={onLogContact}/>;
  if (tab === "tx")        return <SectionTransactions subject={subject}/>;
  if (tab === "tax")       return <SectionTax         subject={subject}/>;
  if (tab === "site")      return <SiteTab            deal={subject}/>;
  if (tab === "market")    return <MarketTab          deal={subject}/>;
  if (tab === "distress")  return <DistressTab        deal={subject}/>;
  if (tab === "docs")      return <SectionDocs/>;
  if (tab === "notes")     return <SectionNotes      subject={subject}/>;
  return null;
}

export function PropertyDetail({ deal, onClose }) {
  const [tab, setTab] = useState("overview");
  const [saved, setSaved] = useState(deal?.fb === "hot");
  const [contactModal, setContactModal] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const subject = useMemo(() => enrichDeal(deal), [deal]);
  const bodyRef = useRef(null);
  const { contacts, fetchContacts, logContact } = useDeals();
  const dealContacts = contacts[deal?.id] || [];

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [tab]);

  useEffect(() => {
    if (deal?.id) fetchContacts(deal.id);
  }, [deal?.id, fetchContacts]);

  async function handleLogContact(payload) {
    setContactSubmitting(true);
    try {
      await logContact(deal.id, payload);
      setContactModal(false);
    } finally {
      setContactSubmitting(false);
    }
  }

  if (!deal) return null;

  return (
    <div className="pd-shell" data-screen-label="Property Detail">
      {contactModal && (
        <ContactLogModal
          onSubmit={handleLogContact}
          onClose={() => setContactModal(false)}
          submitting={contactSubmitting}
        />
      )}
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
          <div className="pd-main"><TabContent tab={tab} subject={subject} contacts={dealContacts} onLogContact={() => setContactModal(true)}/></div>
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
