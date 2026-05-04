import { fmt, hasVal, fmtMoney } from '../../lib/format';

export function MarketTab({ deal }) {
  const bj = deal.briefJson || {};
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Submarket Context</h3></div>
        <div className="kv-grid">
          <span className="k">Submarket</span><span className="v">{deal.submarket}</span>
          <span className="k">Asset Class</span><span className="v">{deal.asset}</span>
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
