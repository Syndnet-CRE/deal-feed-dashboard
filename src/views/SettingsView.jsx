import { I } from '../components/Icons';
import { useAuth } from '../hooks/useAuth';

export function SettingsView({ onConfirmDanger }) {
  const { subscriber } = useAuth();
  const s = subscriber || {};
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <div className="page-sub">Subscriber profile, billing, and account controls</div>
        </div>
      </div>

      <div className="settings-form">
        <div className="settings-section">
          <h3>Profile</h3>
          <div className="field-row">
            <div className="field"><label>Full Name</label><input className="input" defaultValue={s.full_name || ''}/></div>
            <div className="field"><label>Email</label><input className="input" defaultValue={s.email || ''} type="email"/></div>
          </div>
          <div className="field"><label>Firm</label><input className="input" defaultValue={s.company || ''}/></div>
          <div style={{ marginTop: 6 }}><button className="btn primary"><I.Check size={13}/> Save Changes</button></div>
        </div>

        <div className="settings-section">
          <h3>Password</h3>
          <div className="field"><label>Current Password</label><input className="input" type="password" defaultValue="••••••••••"/></div>
          <div className="field-row">
            <div className="field"><label>New Password</label><input className="input" type="password" placeholder="At least 12 characters"/></div>
            <div className="field"><label>Confirm Password</label><input className="input" type="password"/></div>
          </div>
          <div style={{ marginTop: 6 }}><button className="btn">Update Password</button></div>
        </div>

        <div className="settings-section">
          <h3>Subscription</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 10.5, color: "#9DA2B3", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Plan</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: "#FFF" }}>Operator · Annual</div>
              <div style={{ fontSize: 11.5, color: "#9DA2B3", marginTop: 4 }}>$2,400/yr · 4 buy boxes incl.</div>
            </div>
            <div style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 10.5, color: "#9DA2B3", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Next Billing</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: "#FFF" }}>Mar 12, 2027</div>
              <div style={{ fontSize: 11.5, color: "#9DA2B3", marginTop: 4 }}>$2,400 + add-ons</div>
            </div>
            <div style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 10.5, color: "#9DA2B3", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Status</div>
              <div style={{ marginTop: 6 }}><span className="pill green"><span className="pip"/>Active</span></div>
              <div style={{ fontSize: 11.5, color: "#9DA2B3", marginTop: 6 }}>Auto-renew on</div>
            </div>
          </div>
          <button className="btn"><I.External size={13}/> Manage Billing in Stripe</button>
        </div>

        <div className="settings-section">
          <h3>Buy Box Add-ons</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>5 of 6 buy box slots used</div>
              <div style={{ fontSize: 11.5, color: "#9DA2B3", marginTop: 4 }}>1 slot remaining · additional slots are $50/mo each</div>
            </div>
            <button className="btn outline-green"><I.Plus size={13}/> Add Slot — $50/mo</button>
          </div>
        </div>

        <div className="settings-section">
          <h3 style={{ color: "#FF7378" }}>Danger Zone</h3>
          <div className="danger-zone">
            <div className="danger-row">
              <div className="lbl">
                <b>Pause Account</b>
                <span>Stop nightly runs without losing your buy boxes or data. Resume any time.</span>
              </div>
              <button className="btn danger" onClick={() => onConfirmDanger("pause")}>Pause Account</button>
            </div>
            <div className="danger-row">
              <div className="lbl">
                <b>Cancel Subscription</b>
                <span>End service at the close of the current billing period. Buy boxes are deleted after 30 days.</span>
              </div>
              <button className="btn danger" onClick={() => onConfirmDanger("cancel")}>Cancel Subscription</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
