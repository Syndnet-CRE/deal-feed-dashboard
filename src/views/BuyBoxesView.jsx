import { useState } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { useToast } from '../contexts/ToastContext';
import { I } from '../components/Icons';
import { Plus, Settings2 } from 'lucide-react';
import { formatGeo } from '../lib/buyBoxTaxonomy';

const COLUMNS = [
  { id: 'pending',           label: 'Pending',       description: 'Awaiting first run' },
  { id: 'validating',        label: 'Validating',    description: 'Coverage check in progress' },
  { id: 'active',            label: 'Active',        description: 'Running nightly' },
  { id: 'paused',            label: 'Paused',        description: 'Manually paused' },
  { id: 'coverage_failed',   label: 'Coverage Gap',  description: 'No parcel data for this geo' },
];

function normalizeStatus(status) {
  const s = (status || '').toLowerCase().replace(/\s+/g, '_');
  if (s === 'coverage failed') return 'coverage_failed';
  return s;
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };
const DAY_FULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

function ScheduleRow({ schedule, boxId, onToggleDay }) {
  const activeDays = schedule?.days || DAYS;
  return (
    <div className="kanban-schedule-row">
      {DAYS.map(d => (
        <button
          key={d}
          className={`kanban-day-btn ${activeDays.includes(d) ? 'on' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleDay(boxId, d, activeDays); }}
          title={DAY_FULL[d]}
        >
          {DAY_LABELS[d]}
        </button>
      ))}
    </div>
  );
}

function KanbanCard({ box, onEdit, onPause, onResume, onToggleDay }) {
  const status = normalizeStatus(box.status);
  const geoDisplay = formatGeo(box);
  const subtypeCount = box.asset_use_codes?.length ?? 0;

  return (
    <div
      className={`kanban-card kanban-card-${status}`}
      draggable
      onDragStart={e => e.dataTransfer.setData('boxId', String(box.id))}
    >
      <div className="kanban-card-head">
        <div className="kanban-card-name">{box.label || box.name || 'Untitled'}</div>
        <div className="kanban-card-head-right">
          {box.new_deal_count > 0 && (
            <span className="kanban-card-new-deals" title={`${box.new_deal_count} new deals`}>
              +{box.new_deal_count}
            </span>
          )}
          <button className="kanban-card-settings" onClick={() => onEdit?.(box)} title="Edit search">
            <Settings2 size={13} />
          </button>
        </div>
      </div>

      {box.asset_class && (
        <div className="kanban-card-asset">
          <span className="kanban-asset-chip">{box.asset_class}</span>
          {subtypeCount > 0 && (
            <span className="kanban-asset-sub">{subtypeCount} sub-type{subtypeCount !== 1 ? 's' : ''}</span>
          )}
          {box.match_threshold != null && (
            <span className="kanban-card-threshold" title="Match threshold">{box.match_threshold}%</span>
          )}
        </div>
      )}

      {geoDisplay && (
        <div className="kanban-card-geo"><I.Pin size={10} /> {geoDisplay}</div>
      )}

      <div className="kanban-card-stats">
        <span>{box.deals_sent_total ?? 0} delivered</span>
        <span className="kanban-card-lastrun" title="Last run">
          {box.lastRun || '—'}
        </span>
      </div>

      <ScheduleRow
        schedule={box.run_schedule}
        boxId={box.id}
        onToggleDay={onToggleDay}
      />

      <div className="kanban-card-actions">
        {status === 'active' && (
          <button className="kanban-btn pause" onClick={() => onPause?.(box)}>Pause</button>
        )}
        {status === 'paused' && (
          <button className="kanban-btn resume" onClick={() => onResume?.(box)}>Resume</button>
        )}
        {status === 'coverage_failed' && (
          <button className="kanban-btn edit" onClick={() => onEdit?.(box)}>Edit Geo</button>
        )}
        {status === 'pending' && (
          <span className="kanban-btn-status">Activating…</span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ column, boxes, onEdit, onPause, onResume, onToggleDay, onDrop }) {
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const boxId = e.dataTransfer.getData('boxId');
    if (!boxId) return;
    onDrop?.(boxId, column.id);
  }

  return (
    <div
      className={`kanban-column ${dragOver ? 'drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="kanban-col-head">
        <span className="kanban-col-title">{column.label}</span>
        <span className="kanban-col-count">{boxes.length}</span>
      </div>
      <div className="kanban-col-desc">{column.description}</div>
      <div className="kanban-col-cards">
        {boxes.map(box => (
          <KanbanCard
            key={box.id}
            box={box}
            onEdit={onEdit}
            onPause={onPause}
            onResume={onResume}
            onToggleDay={onToggleDay}
          />
        ))}
        {boxes.length === 0 && (
          <div className="kanban-col-empty">No boxes</div>
        )}
      </div>
    </div>
  );
}

export function BuyBoxesView({ onCreate, onEdit, onPause }) {
  const { buyBoxes, loading, patchBuyBox } = useDeals();
  const addToast = useToast();

  async function handleResume(b) {
    try {
      await patchBuyBox(b.id, { status: 'active' });
      addToast('Search resumed — runs tonight.', 'success');
    } catch {
      addToast('Failed to resume. Try again.', 'error');
    }
  }

  async function handleDrop(boxId, targetColumnId) {
    const statusMap = {
      pending:         'pending',
      validating:      'pending',
      active:          'active',
      paused:          'paused',
      coverage_failed: 'Coverage Failed',
    };
    const newStatus = statusMap[targetColumnId];
    if (!newStatus) return;
    try {
      await patchBuyBox(boxId, { status: newStatus });
      addToast('Status updated.', 'success');
    } catch {
      addToast('Failed to update status.', 'error');
    }
  }

  async function handleToggleDay(boxId, day, currentDays) {
    const box = buyBoxes.find(b => b.id === boxId);
    if (!box) return;
    const activeDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    const newSchedule = { ...(box.run_schedule || {}), days: activeDays };
    try {
      await patchBuyBox(boxId, { run_schedule: newSchedule });
      addToast('Schedule updated.', 'success');
    } catch {
      addToast('Failed to update schedule.', 'error');
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-head">
          <div><h1 className="page-title">Buyer Searches</h1></div>
        </div>
        <div className="feed-loading">Loading…</div>
      </div>
    );
  }

  const grouped = {};
  COLUMNS.forEach(col => { grouped[col.id] = []; });
  buyBoxes.forEach(b => {
    const key = normalizeStatus(b.status);
    if (grouped[key]) grouped[key].push(b);
    else grouped['pending'].push(b);
  });

  const activeCount = buyBoxes.filter(b => normalizeStatus(b.status) === 'active').length;

  return (
    <div className="page kanban-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Buyer Searches</h1>
          <div className="page-sub">{activeCount} active</div>
        </div>
        <div className="kanban-header-actions">
          <button className="btn secondary" onClick={onCreate}>
            <I.Search size={13} /> New Buyer Search
          </button>
          <button className="btn primary" onClick={onCreate}>
            <Plus size={13} /> New Buy Box
          </button>
        </div>
      </div>

      <div className="kanban-surface">
        {buyBoxes.length === 0 ? (
          <div className="kanban-empty-state">
            <I.Search size={48} className="kanban-empty-icon" />
            <h2 className="kanban-empty-title">No buyer searches yet</h2>
            <p className="kanban-empty-sub">Set up your first search and we&apos;ll match distressed properties to your criteria nightly.</p>
            <button className="btn primary" onClick={onCreate}>Create Your First Buy Box</button>
          </div>
        ) : (
          <div className="kanban-board">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                boxes={grouped[col.id]}
                onEdit={onEdit}
                onPause={onPause}
                onResume={handleResume}
                onToggleDay={handleToggleDay}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
