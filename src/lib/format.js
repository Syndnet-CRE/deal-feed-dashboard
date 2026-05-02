export function fmtMoney(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function scoreClass(s) {
  if (s >= 80) return "hi";
  if (s >= 60) return "md";
  return "lo";
}
