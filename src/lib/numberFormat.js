// Number formatting + parsing for wizard inputs.
// kind: 'int' | 'money' | 'year' | 'decimal'
//   int     — thousands separators, no decimals (1,500)
//   money   — same as int (the $ glyph lives in the unit slot next to the field)
//   year    — no commas, no decimals (1998)
//   decimal — thousands separators, up to 2 decimals (5.25 or 1,234.56)
//
// Form state always stores the *raw* digit string (no commas). Display formatting
// happens on render-when-blurred only — see NumberField in BuyBoxPage23.jsx.

export function parseNumber(input) {
  if (input == null || input === '') return '';
  const s = String(input).replace(/[^\d.-]/g, '');
  // Collapse multiple decimals: keep only the first
  const firstDot = s.indexOf('.');
  if (firstDot === -1) return s.replace(/-/g, ''); // no minus signs needed
  const head = s.slice(0, firstDot + 1).replace(/-/g, '');
  const tail = s.slice(firstDot + 1).replace(/[.-]/g, '');
  return head + tail;
}

export function formatNumber(value, kind = 'int') {
  if (value === '' || value == null) return '';
  const raw = String(value).replace(/[^\d.]/g, '');
  if (!raw) return '';
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return '';
  if (kind === 'year') {
    return String(Math.trunc(n));
  }
  if (kind === 'decimal') {
    // Preserve user-entered trailing dot or partial decimal during edit
    // by checking the raw string shape.
    if (raw.endsWith('.')) {
      const wholePart = Math.trunc(n).toLocaleString('en-US');
      return wholePart + '.';
    }
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  // int + money — same display, semantic difference is only for unit slot
  return Math.trunc(n).toLocaleString('en-US');
}
