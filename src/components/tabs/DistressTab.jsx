import { I } from '../Icons';
import { fmt, hasVal, fmtMoney } from '../../lib/format';

const SIGNAL_META = {
  "Absentee Owner":     { icon: <I.Pin size={13}/>,      cls: "warn",  desc: "Owner mailing address differs from the property address." },
  "Out-of-State Owner": { icon: <I.External size={13}/>, cls: "warn",  desc: "Owner mail is outside the property state — indicates remote control." },
  "Entity Owner":       { icon: <I.Building size={13}/>, cls: "info",  desc: "Title held in LLC, LP, trust, or other entity structure." },
  "No Permits 5yr":     { icon: <I.Alert size={13}/>,    cls: "hot",   desc: "No building permits pulled in 5+ years — deferred capex signal." },
  "Opportunity Zone":   { icon: <I.Sparkle size={13}/>,  cls: "green", desc: "Parcel is within a federally designated Opportunity Zone." },
};

export function DistressTab({ deal }) {
  const bj = deal.briefJson || {};
  const signals = deal.signals || [];
  const ddFlags = bj.dd_flags || [];
  const permits = bj.permit_history || [];
  const hasForeclosure = hasVal(bj.foreclosure_status);
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head">
          <h3>Distress Score</h3>
          <span style={{ fontSize: 18, fontWeight: 800, color: deal.score >= 75 ? "#1B7A2A" : deal.score >= 50 ? "#B5750E" : "var(--ink-3)" }}>
            {deal.score}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 10 }}>
          Score reflects owner motivation, hold duration, capital activity, and entity signals. Range 0–100.
        </div>
        <div style={{ height: 8, background: "var(--panel-3)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${deal.score}%`, background: deal.score >= 75 ? "var(--green)" : deal.score >= 50 ? "var(--warning)" : "var(--ink-4)", borderRadius: 4 }}/>
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
