import { useState, useMemo, useRef, useEffect } from 'react';
import { I } from './Icons';
import { AerialThumb } from './AerialThumb';
import { fmtMoney, scoreClass, fmt, hasVal } from '../lib/format';
import { COMPS } from '../data/mockData';

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
  const confLevel = dm ? Math.max(1, Math.min(5, Math.round(dm.conf / 20))) : 3;
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Entity Profile</h3></div>
        <div className="kv-grid">
          <span className="k">Recorded Owner</span><span className="v">{subject.owner}</span>
          <span className="k">Entity Type</span><span className="v">{subject.entityType}</span>
          <span className="k">Mailing Address</span><span className="v">{subject.mailing}</span>
          <span className="k">Absentee</span>
          <span className="v">
            {subject.absentee
              ? <span className="pill amber" style={{ fontSize: 10 }}>Yes — Out of Area</span>
              : <span className="pill gray"  style={{ fontSize: 10 }}>No</span>}
          </span>
          <span className="k">FIPS</span><span className="v">{subject.fips || "—"}</span>
        </div>
        {subject.signals?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {subject.signals.map(s => <span key={s} className="tag">{s}</span>)}
          </div>
        )}
      </div>

      {dm && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Skip Trace — Principal</h3><span className="upd" style={{ color: "#5BCC48" }}>Auto-enriched</span></div>
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

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Ownership Chain</h3><span className="upd">County Recorder</span></div>
        <div style={{ padding: "14px 0", color: "var(--ink-3)", fontSize: 12.5 }}>
          Full chain including entity piercing, UCC filings, and beneficial ownership detail available with API enrichment.
        </div>
      </div>
    </>
  );
}

function SectionTransactions({ subject }) {
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Current Assessment</h3><span className="upd">Tax Roll 2025</span></div>
        <div className="kv-grid">
          <span className="k">Total Assessed</span><span className="v">{fmtMoney(subject.value)}</span>
          <span className="k">Land Value</span><span className="v">—</span>
          <span className="k">Improvement</span><span className="v">—</span>
          <span className="k">Assessment Year</span><span className="v">2025</span>
          <span className="k">GIS Acreage</span><span className="v">{subject.gisAcres?.toFixed(2)} ac</span>
          <span className="k">Recorded Acreage</span><span className="v">{subject.acres?.toFixed(2)} ac</span>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Transfer History</h3><span className="upd">County Deed Records</span></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Type</th><th>Grantor</th><th>Grantee</th><th>Amount</th><th>Doc #</th></tr></thead>
            <tbody>
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}>Transfer records load via county API enrichment.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Mortgage &amp; Liens</h3></div>
        <div className="kv-grid">
          <span className="k">Open Liens</span><span className="v">—</span>
          <span className="k">Active Mortgage</span><span className="v">—</span>
          <span className="k">HELOC</span><span className="v">—</span>
          <span className="k">UCC Filings</span><span className="v">—</span>
        </div>
      </div>
    </>
  );
}

function SectionTax({ subject }) {
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Tax Assessment</h3><span className="upd">2025 Tax Roll</span></div>
        <div className="kv-grid">
          <span className="k">Total Assessed</span><span className="v">{fmtMoney(subject.value)}</span>
          <span className="k">Land Assessed</span><span className="v">—</span>
          <span className="k">Improvement</span><span className="v">—</span>
          <span className="k">Market Value Est.</span><span className="v">—</span>
          <span className="k">Exemptions</span><span className="v">—</span>
          <span className="k">Net Taxable</span><span className="v">—</span>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Tax Bill</h3></div>
        <div className="kv-grid">
          <span className="k">Annual Tax</span><span className="v">—</span>
          <span className="k">Tax Rate</span><span className="v">—</span>
          <span className="k">Millage Rate</span><span className="v">—</span>
          <span className="k">Tax Year</span><span className="v">2025</span>
          <span className="k">Due Date</span><span className="v">—</span>
          <span className="k">Delinquency</span><span className="v">—</span>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Tax History</h3></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Year</th><th>Assessed</th><th>Tax Bill</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px 0", color: "var(--ink-3)" }}>Tax history available via county API enrichment.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SectionSite({ subject }) {
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Parcel Details</h3></div>
        <div className="kv-grid">
          <span className="k">APN</span><span className="v">{subject.apn}</span>
          <span className="k">FIPS</span><span className="v">{subject.fips || "—"}</span>
          <span className="k">Census Tract</span><span className="v">{subject.censusTract}</span>
          <span className="k">Lot Acreage</span><span className="v">{subject.acres?.toFixed(2)} ac</span>
          <span className="k">GIS Acreage</span><span className="v">{subject.gisAcres?.toFixed(2)} ac</span>
          <span className="k">Zoning</span><span className="v">{subject.zoning}</span>
          <span className="k">Land Use</span><span className="v">{subject.asset}</span>
          <span className="k">Subdivision</span><span className="v">—</span>
        </div>
      </div>
      {(subject.sf || subject.yearBuilt) && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Improvements</h3></div>
          <div className="kv-grid">
            {subject.sf       && <><span className="k">Building SF</span><span className="v">{subject.sf.toLocaleString()} SF</span></>}
            {subject.yearBuilt && <><span className="k">Year Built</span><span className="v">{subject.yearBuilt}</span></>}
            <span className="k">Stories</span><span className="v">—</span>
            <span className="k">Construction</span><span className="v">—</span>
            <span className="k">Roof Type</span><span className="v">—</span>
            <span className="k">Condition</span><span className="v">—</span>
          </div>
        </div>
      )}
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Utilities &amp; Access</h3></div>
        <div className="kv-grid">
          <span className="k">Water</span><span className="v">—</span>
          <span className="k">Sewer</span><span className="v">—</span>
          <span className="k">Electric</span><span className="v">—</span>
          <span className="k">Gas</span><span className="v">—</span>
          <span className="k">Road Frontage</span><span className="v">—</span>
          <span className="k">Rail Access</span><span className="v">—</span>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Environmental Flags</h3></div>
        <div className="kv-grid">
          <span className="k">Flood Zone</span><span className="v">—</span>
          <span className="k">Wetlands</span><span className="v">—</span>
          <span className="k">EPA Site</span><span className="v">—</span>
          <span className="k">Phase I</span><span className="v">—</span>
          <span className="k">Brownfield</span><span className="v">—</span>
        </div>
      </div>
    </>
  );
}

function SectionMarket({ subject }) {
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Submarket Context</h3></div>
        <div className="kv-grid">
          <span className="k">Submarket</span><span className="v">{subject.submarket}</span>
          <span className="k">Asset Class</span><span className="v">{subject.asset}</span>
          <span className="k">Vacancy Rate</span><span className="v">—</span>
          <span className="k">Avg Asking Rent</span><span className="v">—</span>
          <span className="k">Net Absorption</span><span className="v">—</span>
          <span className="k">Deliveries (12mo)</span><span className="v">—</span>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Comparable Sales</h3><span className="upd">Sample data</span></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Address</th><th>Type</th><th>Date</th><th>Price</th><th>Bldg SF</th><th>Dist</th><th>Sim</th></tr>
            </thead>
            <tbody>
              {COMPS.map((c, i) => (
                <tr key={i}>
                  <td>{c.addr}</td>
                  <td><span className="tag" style={{ fontSize: 10.5 }}>{c.type}</span></td>
                  <td style={{ color: "var(--ink-3)" }}>{c.date}</td>
                  <td style={{ fontWeight: 600 }}>{c.price}</td>
                  <td style={{ color: "var(--ink-3)" }}>{c.sf === "0" ? "—" : c.sf}</td>
                  <td style={{ color: "var(--ink-3)" }}>{c.dist}</td>
                  <td><span className={`pill ${c.sim >= 85 ? "green" : c.sim >= 75 ? "amber" : "gray"}`} style={{ fontSize: 10 }}>{c.sim}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Active Listings Nearby</h3></div>
        <div style={{ padding: "14px 0", color: "var(--ink-3)", fontSize: 12.5 }}>
          Active listing data available via CoStar / LoopNet API enrichment.
        </div>
      </div>
    </>
  );
}

function SectionDistress({ subject }) {
  const signals = subject.signals || [];
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

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Additional Checks</h3></div>
        <div className="kv-grid">
          <span className="k">NOD Filed</span><span className="v">—</span>
          <span className="k">Foreclosure</span><span className="v">—</span>
          <span className="k">Code Violations</span><span className="v">—</span>
          <span className="k">Open Permits</span><span className="v">—</span>
          <span className="k">Probate</span><span className="v">—</span>
          <span className="k">Bankruptcy</span><span className="v">—</span>
          <span className="k">IRS Liens</span><span className="v">—</span>
          <span className="k">HOA Dues</span><span className="v">—</span>
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
  const [note, setNote] = useState(subject.notes || "");
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
        <button className="btn sm primary" disabled={!note.trim()}>Save Note</button>
        {note.length > 0 && <button className="btn sm" onClick={() => setNote("")}>Clear</button>}
      </div>
    </div>
  );
}

function RailFit({ subject }) {
  const items = [
    ["Asset Class", subject.asset,                     true],
    ["Geography",   subject.city,                      true],
    ["Lot Size",    `${subject.acres?.toFixed(2)} ac`, subject.acres >= 1],
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
