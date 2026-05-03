import { useDeals } from '../contexts/DealsContext';
import { BUY_BOXES as MOCK_BUY_BOXES } from '../data/mockData';
import { I } from '../components/Icons';

export function BuyBoxesView({ onCreate }) {
  const { buyBoxes: apiBuyBoxes, loading } = useDeals();
  const buyBoxes = (!loading && apiBuyBoxes.length === 0) ? MOCK_BUY_BOXES : apiBuyBoxes;
  const failed = buyBoxes.filter(b => b.status === "Coverage Failed");
  const activeCount = buyBoxes.filter(b => b.status === "Active").length;

  if (loading) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Buy Boxes</h1>
            <div className="page-sub">Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Buy Boxes</h1>
          <div className="page-sub">Manage the criteria that drive each nightly deal-feed run · {activeCount} active</div>
        </div>
        <div className="spaced">
          <button className="btn"><I.External size={13}/> Coverage Map</button>
          <button className="btn primary" onClick={onCreate}><I.Plus size={13}/> New Buy Box</button>
        </div>
      </div>

      {failed.length > 0 && (
        <div className="callout">
          <div className="cal-ico"><I.Alert size={16}/></div>
          <div className="cal-text">
            <b>Coverage Failed:</b> {failed.map(b => b.name).join(", ")} could not be activated. We do not yet have parcel data for that geography. <a href="#" style={{ color: "#FF7378", fontWeight: 700, textDecoration: "underline" }}>Edit geography</a> or contact support.
          </div>
        </div>
      )}

      {buyBoxes.length === 0 ? (
        <div className="empty" style={{ marginTop: 48 }}>
          <div className="empty-ico"><I.Building size={22}/></div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No buy boxes yet</div>
          <div className="empty-msg">Create your first buy box to start receiving nightly deals.</div>
          <button className="btn primary sm" onClick={onCreate}><I.Plus size={13}/> New Buy Box</button>
        </div>
      ) : (
        <div className="bb-grid">
          {buyBoxes.map(b => {
            const intent = b.status === "Active" ? "green" : b.status === "Pending" ? "amber" : b.status === "Coverage Failed" ? "red" : "gray";
            return (
              <div className="bb-card" key={b.id}>
                <div className="bb-head">
                  <div>
                    <div className="bb-name">{b.name}</div>
                    <div className="bb-geo"><I.Pin size={11}/> {b.geo}</div>
                  </div>
                  <span className={`pill ${intent}`}><span className="pip"/>{b.status}</span>
                </div>
                <div className="bb-tags">
                  {(b.classes || []).map(c => <span key={c} className="tag">{c}</span>)}
                </div>
                <div className="bb-detail-grid">
                  <span className="k">Min Hold</span><span className="v">{b.hold}</span>
                  <span className="k">Created</span><span className="v">{b.created}</span>
                  <span className="k">Last Run</span><span className="v" style={{ fontSize: 11, color: b.status === "Coverage Failed" ? "#FF7378" : null }}>{b.lastRun}</span>
                </div>
                <div className="bb-stats">
                  <div className="bb-stat"><div className="num">{b.deals}</div><div className="lbl">Deals Delivered</div></div>
                  <div className="bb-stat"><div className="num" style={{ fontSize: 14, fontWeight: 700 }}>{b.status === "Active" ? "Nightly" : b.status === "Pending" ? "Q'd" : "—"}</div><div className="lbl">Cadence</div></div>
                </div>
                <div className="bb-actions">
                  <button className="btn sm" style={{ flex: 1 }}><I.Edit size={12}/> Edit</button>
                  {b.status === "Active" && <button className="btn sm" style={{ flex: 1 }}><I.Pause size={12}/> Pause</button>}
                  {b.status === "Paused" && <button className="btn outline-green sm" style={{ flex: 1 }}><I.Play size={12}/> Resume</button>}
                  {b.status === "Pending" && <button className="btn sm" style={{ flex: 1 }} disabled>Activating…</button>}
                  {b.status === "Coverage Failed" && <button className="btn sm" style={{ flex: 1, color: "#FF7378", borderColor: "rgba(229,72,77,0.4)" }}>Edit Geo</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
