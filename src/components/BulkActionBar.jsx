export function BulkActionBar({ count, onStatus, onFeedback, onExport, onClear }) {
  return (
    <div className="bulk-action-bar">
      <span className="bulk-count">{count} selected</span>

      <select
        className="select xs"
        defaultValue=""
        onChange={e => { if (e.target.value) { onStatus(e.target.value); e.target.value = ''; } }}
      >
        <option value="" disabled>Status...</option>
        <option value="active">Active</option>
        <option value="dead">Dead</option>
        <option value="loi">LOI</option>
        <option value="archived">Archived</option>
      </select>

      <button className="btn xs" onClick={() => onFeedback('hot')}>Hot</button>
      <button className="btn xs" onClick={() => onFeedback('no')}>No</button>
      <button className="btn xs" onClick={onExport}>Export CSV</button>

      <button className="btn xs bulk-clear" onClick={onClear} title="Clear selection">✕</button>
    </div>
  );
}
