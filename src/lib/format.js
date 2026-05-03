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
