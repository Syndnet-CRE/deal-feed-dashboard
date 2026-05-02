import { useState } from 'react';
import { ASSET_CLASSES } from '../data/mockData';
import { I } from './Icons';
import { MapBackground } from './MapBackground';

export function NewBoxWizard({ onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Nashville — IOS");
  const [classes, setClasses] = useState(["Industrial Outdoor"]);
  const [hold, setHold] = useState("5");
  const total = 4;

  const toggle = (c) => setClasses(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>New Buy Box</h3>
            <div style={{ fontSize: 11.5, color: "#9DA2B3", marginTop: 2 }}>Step {step} of {total} · {step === 1 ? "Name your box" : step === 2 ? "Pick asset classes" : step === 3 ? "Define geography" : "Review & activate"}</div>
          </div>
          <button className="drawer-close" onClick={onClose}><I.Close size={14}/></button>
        </div>
        <div className="modal-body" style={{ minHeight: 280 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
            {[1, 2, 3, 4].map(s => <div key={s} style={{ flex: 1, height: 3, background: s <= step ? "#1DAF29" : "#40424D", borderRadius: 2 }}/>)}
          </div>

          {step === 1 && (
            <div>
              <div className="field"><label>Buy Box Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)}/></div>
              <div className="field"><label>Internal Description (optional)</label><input className="input" placeholder="e.g. Trailer & container yards within 35 mi of CSX yard"/></div>
              <div className="field"><label>Min Hold Period</label>
                <select className="select" value={hold} onChange={(e) => setHold(e.target.value)}>
                  <option value="3">3 years</option>
                  <option value="5">5 years</option>
                  <option value="7">7 years</option>
                  <option value="10">10 years</option>
                </select>
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {ASSET_CLASSES.map(c => {
                const sel = classes.includes(c);
                return (
                  <button key={c} onClick={() => toggle(c)} className="btn" style={{ justifyContent: "flex-start", padding: "12px 14px", background: sel ? "rgba(29,175,41,0.10)" : "var(--panel)", borderColor: sel ? "#1DAF29" : "var(--hairline)", color: sel ? "#5BCC48" : "#FFF" }}>
                    {sel ? <I.Check size={14}/> : <I.Plus size={14}/>}{c}
                  </button>
                );
              })}
            </div>
          )}
          {step === 3 && (
            <div>
              <div className="field"><label>Geography Type</label>
                <select className="select"><option>MSA</option><option>County List</option><option>ZIP Codes</option><option>Custom Polygon</option></select>
              </div>
              <div className="field"><label>MSA</label>
                <select className="select"><option>Nashville–Davidson, TN</option><option>Atlanta–Sandy Springs, GA</option><option>Charlotte–Concord, NC</option></select>
              </div>
              <div style={{ height: 160, background: "#0A0A0E", border: "1px solid var(--hairline)", borderRadius: 8, marginTop: 8, position: "relative", overflow: "hidden" }}>
                <MapBackground/>
                <div style={{ position: "absolute", inset: 12, border: "1.5px dashed #1DAF29", borderRadius: 8, background: "rgba(29,175,41,0.04)" }}/>
              </div>
              <div style={{ fontSize: 11.5, color: "#9DA2B3", marginTop: 8 }}>13 counties · ~2.4M parcels · coverage verified</div>
            </div>
          )}
          {step === 4 && (
            <div>
              <div style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9DA2B3" }}>Name</span><b>{name}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9DA2B3" }}>Asset Classes</span><span>{classes.join(", ") || "—"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9DA2B3" }}>Geography</span><b>Nashville–Davidson MSA</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#9DA2B3" }}>Min Hold</span><b>{hold} yr</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--hairline-soft)", paddingTop: 10 }}><span style={{ color: "#9DA2B3" }}>Add-on Cost</span><b style={{ color: "#5BCC48" }}>$50.00 / mo</b></div>
              </div>
              <div style={{ fontSize: 11.5, color: "#9DA2B3", marginTop: 12 }}>First nightly run will execute tonight at 02:00 EDT. You will receive an email summary on completion.</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}
          {step < total && <button className="btn primary" onClick={() => setStep(step + 1)}>Next</button>}
          {step === total && <button className="btn primary" onClick={onClose}><I.Check size={13}/> Activate Buy Box</button>}
        </div>
      </div>
    </div>
  );
}
