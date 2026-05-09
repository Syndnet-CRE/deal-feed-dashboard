import { useState } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { I } from '../components/Icons';
import { Plus, Settings2 } from 'lucide-react';
import { formatGeo, formatSchedule } from '../lib/buyBoxTaxonomy';

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

function ScheduleRow({ schedule, boxId, onToggleDay }) {
  const activeDays = schedule?.days || DAYS;
  return (
    <div className="kanban-schedule-row">
      {DAYS.map(d => (
        <button
          key={d}
          className={`kanban-day-btn ${activeDays.includes(d) ? 'on' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleDay(boxId, d, activeDays); }}
          title={d}
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

  return (
    <div
      className={`kanban-card kanban-card-${status}`}
      draggable
      onDragStart={e => e.dataTransfer.setData('boxId', String(box.id))}
    >
      <div className="kanban-card-head">
        <div className="kanban-card-name">{box.label || box.name || 'Untitled'}</div>
        <button className="kanban-card-settings" onClick={() => onEdit?.(box)} title="Edit">
          <Settings2 size={13} />
        </button>
      </div>

      {geoDisplay && (
        <div className="kanban-card-geo"><I.Pin size={10} /> {geoDisplay}</div>
      )}

      <div className="kanban-card-stats">
        <span>{box.deals_sent_total ?? 0} delivered</span>
        <span>{box.asset_class || '—'}</span>
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
    const boxId = parseInt(e.dataTransfer.getData('boxId'), 10);
    if (boxId) onDrop?.(boxId, column.id);
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

  async function handleResume(b) {
    try {
      await patchBuyBox(b.id, { status: 'active' });
    } catch (_) {}
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
    } catch (_) {}
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
    } catch (_) {}
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-head">
          <div><h1 className="page-title">Buy Boxes</h1></div>
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

  return (
    <div className="page kanban-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Buy Boxes</h1>
          <div className="page-sub">
            {buyBoxes.filter(b => normalizeStatus(b.status) === 'active').length} active
          </div>
        </div>
        <button className="btn primary" onClick={onCreate}>
          <Plus size={13} /> New Buy Box
        </button>
      </div>

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
    </div>
  );
}
