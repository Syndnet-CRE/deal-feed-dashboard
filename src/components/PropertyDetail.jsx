import { useState, useMemo, useRef, useEffect } from 'react';
import { I } from './Icons';
import { AerialThumb } from './AerialThumb';
import { fmtMoney, scoreClass } from '../lib/format';

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

function ConfidenceGauge({ level }) {
  const labels = ["Very Low", "Low", "Medium", "High", "Very High"];
  return (
    <span className="gauge">
      <span className="gauge-track">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`gauge-seg ${s <= level ? "on-" + level : ""}`}/>
        ))}
      </span>
      <span className="gauge-label">{labels[level - 1]}</span>
    </span>
  );
}

function enrichDeal(deal) {
  return {
    ...deal,
    apn:          deal.apn         || "—",
    censusTract:  deal.censusTract || "—",
    submarket:    deal.submarket   || deal.city || "—",
    sf:           deal.sf          || null,
    yearBuilt:    deal.yearBuilt   || null,
    zoning:       deal.zoning      || "—",
    totalAssessed: deal.value,
    parcelOwner:  deal.owner       || "—",
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
              {subject.censusTract !== "—" && <>
                <span>·</span>
                <span>Tract {subject.censusTract}</span>
              </>}
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
    ["Address",  `${subject.addr}, ${subject.city}`],
    ["Asset",    subject.asset],
    ["Lot",      `${subject.acres?.toFixed(2)} ac`],
    ["Assessed", fmtMoney(subject.value)],
    ["Box",      subject.box],
    ["APN",      subject.apn],
    subject.sf        && ["Building",   `${subject.sf.toLocaleString()} SF`],
    subject.yearBuilt && ["Year Built", subject.yearBuilt],
    ["Zoning",   subject.zoning],
  ].filter(Boolean);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "1 / 1" }}>
          <AerialThumb id={subject.id} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        </div>
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {signals.map((s, i) => (
              <span key={i} className={`pill ${s.cls}`}>{s.label}</span>
            ))}
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
          <div className="ai-body"><p>{subject.narrative}</p></div>
        </div>
      )}

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Comparable Sales</h3></div>
        <div style={{ padding: "12px 0", color: "var(--ink-3)", fontSize: 13 }}>
          Comp data loads after skip-trace enrichment. Check the <b>Market &amp; Comps</b> tab.
        </div>
      </div>
    </>
  );
}

function TabStub({ label }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-3)" }}>
      <I.Layers size={28} style={{ opacity: 0.35, marginBottom: 12 }}/>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Available in the full enrichment tier</div>
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
  if (tab === "overview")  return <SectionOverview subject={subject}/>;
  if (tab === "ownership") return <TabStub label="Ownership & Skip Trace"/>;
  if (tab === "tx")        return <TabStub label="Transaction History"/>;
  if (tab === "tax")       return <TabStub label="Tax & Assessment"/>;
  if (tab === "site")      return <TabStub label="Site & Environmental"/>;
  if (tab === "market")    return <TabStub label="Market & Comps"/>;
  if (tab === "distress")  return <TabStub label="Distress Signals"/>;
  if (tab === "docs")      return <TabStub label="Documents"/>;
  if (tab === "notes")     return <TabStub label="Notes"/>;
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
      <div className="pd-body" ref={bodyRef}>
        <div className="pd-content">
          <div className="pd-main">
            <TabContent tab={tab} subject={subject}/>
          </div>
          <aside className="pd-rail">
            <RailFit subject={subject}/>
            <RailDataQuality/>
            <RailNextSteps/>
          </aside>
        </div>
        <div className="pd-footer">
          <span>Parcyl Deal Feed · All public records</span>
        </div>
      </div>
    </div>
  );
}
