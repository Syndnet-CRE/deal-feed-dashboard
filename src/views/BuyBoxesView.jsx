import { useState } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { I } from '../components/Icons';
import { formatGeo, formatUseCodes, formatSchedule, getAssetClass } from '../lib/buyBoxTaxonomy';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function BuyBoxesView({ onCreate, onEdit, onPause }) {
  const { buyBoxes, loading, patchBuyBox } = useDeals();
  const [resumeError, setResumeError] = useState(null);
  const failed = buyBoxes.filter(b => b.status === 'Coverage Failed');
  const activeCount = buyBoxes.filter(b => b.status === 'active' || b.status === 'Active').length;

  async function handleResume(b) {
    try {
      setResumeError(null);
      await patchBuyBox(b.id, { status: 'active' });
    } catch (err) {
      setResumeError(err?.message || 'Resume failed. Please try again.');
    }
  }

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
          <div className="page-sub">
            Manage the criteria that drive each nightly deal-feed run · {activeCount} active
          </div>
        </div>
        <div className="spaced">
          <button className="btn primary" onClick={onCreate}><I.Plus size={13}/> New Buy Box</button>
        </div>
      </div>

      {resumeError && (
        <div className="callout">
          <div className="cal-ico"><I.Alert size={16}/></div>
          <div className="cal-text">{resumeError}</div>
        </div>
      )}

      {failed.length > 0 && (
        <div className="callout">
          <div className="cal-ico"><I.Alert size={16}/></div>
          <div className="cal-text">
            <b>Coverage Failed:</b>{' '}
            {failed.map(b => b.label || b.name).join(', ')} could not be activated.
            We do not yet have parcel data for that geography.{' '}
            <a href="#" style={{ color: '#FF7378', fontWeight: 700, textDecoration: 'underline' }}>
              Edit geography
            </a>{' '}
            or contact support.
          </div>
        </div>
      )}

      {buyBoxes.length === 0 ? (
        <div className="empty" style={{ marginTop: 48 }}>
          <div className="empty-ico"><I.Building size={22}/></div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No buy boxes yet</div>
          <div className="empty-msg">
            Create your first buy box to start receiving nightly deals.
          </div>
          <button className="btn primary sm" onClick={onCreate}>
            <I.Plus size={13}/> New Buy Box
          </button>
        </div>
      ) : (
        <div className="bb-grid">
          {buyBoxes.map(b => {
            const statusNorm = (b.status || '').toLowerCase();
            const intent = statusNorm === 'active' ? 'green'
              : statusNorm === 'pending' ? 'amber'
              : statusNorm === 'coverage failed' ? 'red'
              : 'gray';
            const statusLabel = b.status || 'Unknown';
            const boxName = b.label || b.name || 'Untitled';
            const geoDisplay = formatGeo(b);
            const cls = getAssetClass(b.asset_class);
            const subtypes = b.asset_class && b.asset_use_codes?.length
              ? formatUseCodes(b.asset_class, b.asset_use_codes)
              : (b.asset_classes?.join(', ') || '—');
            const schedule = b.run_schedule ? formatSchedule(b.run_schedule) : 'Runs daily';

            return (
              <div className="bb-card" key={b.id}>
                <div className="bb-head">
                  <div>
                    <div className="bb-name">{boxName}</div>
                    <div className="bb-geo"><I.Pin size={11}/> {geoDisplay}</div>
                  </div>
                  <span className={`pill ${intent}`}>
                    <span className="pip"/>{statusLabel}
                  </span>
                </div>
                <div className="bb-tags">
                  {cls && <span className="tag">{cls.label}</span>}
                  {!cls && (b.asset_classes || []).map(c => <span key={c} className="tag">{c}</span>)}
                </div>
                {subtypes && subtypes !== '—' && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
                    {subtypes}
                  </div>
                )}
                <div className="bb-detail-grid">
                  <span className="k">Schedule</span>
                  <span className="v">{schedule}</span>
                  <span className="k">Last Run</span>
                  <span className="v" style={{ fontSize: 11, color: statusNorm === 'coverage failed' ? '#FF7378' : undefined }}>
                    {fmtDate(b.last_run_at)}
                  </span>
                  <span className="k">Created</span>
                  <span className="v">{fmtDate(b.created_at)}</span>
                </div>
                <div className="bb-stats">
                  <div className="bb-stat">
                    <div className="num">{b.deals_sent_total ?? 0}</div>
                    <div className="lbl">Deals Delivered</div>
                  </div>
                  <div className="bb-stat">
                    <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>
                      {statusNorm === 'active' ? 'Nightly' : statusNorm === 'pending' ? "Q'd" : '—'}
                    </div>
                    <div className="lbl">Cadence</div>
                  </div>
                </div>
                <div className="bb-actions">
                  <button className="btn sm" style={{ flex: 1 }} onClick={() => onEdit?.(b)}>
                    <I.Edit size={12}/> Edit
                  </button>
                  {statusNorm === 'active' && (
                    <button className="btn sm" style={{ flex: 1 }} onClick={() => onPause?.(b)}>
                      <I.Pause size={12}/> Pause
                    </button>
                  )}
                  {statusNorm === 'paused' && (
                    <button className="btn outline-green sm" style={{ flex: 1 }} onClick={() => handleResume(b)}>
                      <I.Play size={12}/> Resume
                    </button>
                  )}
                  {statusNorm === 'pending' && (
                    <button className="btn sm" style={{ flex: 1 }} disabled>Activating…</button>
                  )}
                  {statusNorm === 'coverage failed' && (
                    <button className="btn sm" style={{ flex: 1, color: '#FF7378', borderColor: 'rgba(229,72,77,0.4)' }} onClick={() => onEdit?.(b)}>
                      Edit Geo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
