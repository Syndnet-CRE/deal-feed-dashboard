export function fmtMoney(n) {
  if (n == null) return '—';
  const num = Number(n);
  if (!isFinite(num)) return '—';
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

export function scoreClass(s) {
  if (s == null) return "lo";
  const num = Number(s);
  if (!isFinite(num)) return "lo";
  if (num >= 80) return "hi";
  if (num >= 60) return "md";
  return "lo";
}

export function fmt(val) {
  if (val == null || val === '' || val === 'null' || val === 'undefined') return '—';
  return String(val);
}

export function hasVal(val) {
  return val != null && val !== '' && val !== 'null' && val !== 'undefined';
}

export function fmtRelativeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return null;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return { label: 'Today', days: 0 };
  if (days === 1) return { label: '1 day ago', days: 1 };
  return { label: `${days} days ago`, days };
}

export function freshnessColor(days) {
  if (days == null) return null;
  if (days <= 7) return 'var(--green)';
  if (days <= 30) return 'var(--warning)';
  return 'var(--ink-4)';
}

export const agingColor = freshnessColor;
