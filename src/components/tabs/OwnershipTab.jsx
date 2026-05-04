import { I } from '../Icons';
import { fmt, hasVal } from '../../lib/format';

export function ConfidenceGauge({ level }) {
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

export function OwnershipTab({ deal, contacts, onLogContact }) {
  const { dm } = deal;
  const bj = deal.briefJson || {};
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
          <span className="k">FIPS</span><span className="v">{deal.fips || "—"}</span>
        </div>
        {deal.signals?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {deal.signals.map(s => <span key={s} className="tag">{s}</span>)}
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

      {contacts && contacts.length > 0 && (
        <div className="pd-section">
          <div className="pd-sec-head">
            <h3>Contact History</h3>
            <span className="upd">{contacts.length} {contacts.length === 1 ? "entry" : "entries"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {contacts.map((c, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--hairline-soft)", fontSize: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: c.notes ? 4 : 0 }}>
                  <span style={{ color: "var(--ink-3)", minWidth: 80 }}>{c.contacted_at ? new Date(c.contacted_at).toLocaleDateString() : "—"}</span>
                  <span className="tag" style={{ fontSize: 10.5 }}>{c.channel}</span>
                  <span style={{ color: "var(--ink-2)" }}>{c.outcome}</span>
                </div>
                {c.notes && <div style={{ color: "var(--ink-3)", fontSize: 11, paddingLeft: 90 }}>{c.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {onLogContact && (
        <div className="pd-section" style={{ paddingTop: 4 }}>
          <button className="btn sm" onClick={onLogContact}><I.Phone size={12}/> Log Contact</button>
        </div>
      )}
    </>
  );
}
