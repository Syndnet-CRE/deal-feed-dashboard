import { useRef, useEffect, useCallback, useState } from 'react';
import { DealPanelCard } from './DealPanelCard';
import { BulkActionBar } from './BulkActionBar';
import { useDeals } from '../contexts/DealsContext';

const OWNER_CHIPS = [
  { label: 'Individual', value: 'Individual' },
  { label: 'LLC',        value: 'LLC' },
  { label: 'Trust',      value: 'Trust' },
  { label: 'Corporate',  value: 'Corporate' },
];

const SORT_LABELS = {
  recent:   'Most Recent',
  distress: 'Highest Distress',
  value:    'Highest Value',
};

function exportCSV(deals) {
  const header = 'Address,City,Asset,Acres,Value,Score,Days\n';
  const rows = deals.map(d =>
    [d.addr, d.city, d.asset, d.acres, d.value, d.score, d.days]
      .map(v => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`))
      .join(',')
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'deals.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function DealPanel({
  deals, buyBoxes, filters, onFilterChange,
  expandedCardId, onExpandCard, onOpenDeal,
  onHoverDeal,
}) {
  const cardRefs = useRef({});
  const { postFeedback, updateStatus } = useDeals();

  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const allSelected = deals.length > 0 && deals.every(d => selectedIds.has(d.id));
  const toggleAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(deals.map(d => d.id)));
  }, [allSelected, deals]);

  const handleBulkStatus = useCallback(async (status) => {
    await Promise.all([...selectedIds].map(id => updateStatus(id, status)));
    setSelectedIds(new Set());
  }, [selectedIds, updateStatus]);

  const handleBulkFeedback = useCallback(async (fb) => {
    await Promise.all([...selectedIds].map(id => postFeedback(id, fb)));
    setSelectedIds(new Set());
  }, [selectedIds, postFeedback]);

  const handleBulkExport = useCallback(() => {
    exportCSV(deals.filter(d => selectedIds.has(d.id)));
  }, [deals, selectedIds]);

  useEffect(() => {
    if (!expandedCardId) return;
    const timer = setTimeout(() => {
      const el = cardRefs.current[expandedCardId];
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 220);
    return () => clearTimeout(timer);
  }, [expandedCardId]);

  const assetClasses = [...new Set(deals.map(d => d.asset))].filter(Boolean).sort();
  const activeBoxes  = buyBoxes.filter(b => b.status === 'Active');

  const toggleOwnerType = useCallback((type) => {
    const curr = filters.ownerTypes || [];
    const next = curr.includes(type) ? curr.filter(t => t !== type) : [...curr, type];
    onFilterChange({ ...filters, ownerTypes: next });
  }, [filters, onFilterChange]);

  const toggleHasContact = useCallback(() => {
    onFilterChange({ ...filters, hasContactInfo: !filters.hasContactInfo });
  }, [filters, onFilterChange]);

  return (
    <div className="deal-panel-inner">
      <div className="panel-filter-header">
        <div className="filter-row">
          <select className="select xs" value={filters.box} onChange={e => onFilterChange({ ...filters, box: e.target.value })}>
            <option value="all">All Buy Boxes</option>
            {activeBoxes.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <select className="select xs" value={filters.range} onChange={e => onFilterChange({ ...filters, range: e.target.value })}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="all">All Time</option>
          </select>
          <select className="select xs" value={filters.klass} onChange={e => onFilterChange({ ...filters, klass: e.target.value })}>
            <option value="all">All Classes</option>
            {assetClasses.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="select xs" value={filters.sort} onChange={e => onFilterChange({ ...filters, sort: e.target.value })}>
            <option value="recent">Most Recent</option>
            <option value="distress">Highest Distress</option>
            <option value="value">Highest Value</option>
          </select>
        </div>

        <div className="filter-row chips">
          {OWNER_CHIPS.map(c => (
            <button
              key={c.value}
              className={`chip${(filters.ownerTypes || []).includes(c.value) ? ' active' : ''}`}
              onClick={() => toggleOwnerType(c.value)}
            >
              {c.label}
            </button>
          ))}
          <button
            className={`chip${filters.hasContactInfo ? ' active' : ''}`}
            onClick={toggleHasContact}
          >
            Has Contact Info
          </button>
        </div>

        <div className="panel-summary">
          <label className="panel-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
            />
            <span>{deals.length} deals · sorted by {SORT_LABELS[filters.sort] || 'Most Recent'}</span>
          </label>
          <button className="btn xs" onClick={() => exportCSV(deals)}>Export CSV</button>
        </div>
      </div>

      <div className="panel-card-list">
        {deals.length === 0 ? (
          <div className="panel-empty">No deals match the current filters.</div>
        ) : (
          deals.map((d, i) => (
            <DealPanelCard
              key={d.id}
              ref={el => { if (el) cardRefs.current[d.id] = el; else delete cardRefs.current[d.id]; }}
              deal={d}
              index={i}
              expanded={expandedCardId === d.id}
              onExpand={onExpandCard}
              onOpenDeal={onOpenDeal}
              selected={selectedIds.has(d.id)}
              onSelect={toggleSelect}
              onHover={onHoverDeal}
              onHoverEnd={() => onHoverDeal?.(null)}
            />
          ))
        )}
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onStatus={handleBulkStatus}
          onFeedback={handleBulkFeedback}
          onExport={handleBulkExport}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
