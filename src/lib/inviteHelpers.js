const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseInvitesFromText(text) {
  if (!text || !text.trim()) return [];

  return text
    .split(/[\n,;]+/)
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      // "First Last <email@example.com>"
      const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
      if (angleMatch) {
        return { full_name: angleMatch[1].trim(), email: angleMatch[2].trim().toLowerCase() };
      }

      // "email@example.com  First Last"
      const emailFirstMatch = trimmed.match(/^([^\s@]+@[^\s@]+\.[^\s@]+)\s+(.+)$/);
      if (emailFirstMatch) {
        return { email: emailFirstMatch[1].toLowerCase(), full_name: emailFirstMatch[2].trim() };
      }

      // bare email
      if (EMAIL_RE.test(trimmed)) {
        return { email: trimmed.toLowerCase(), full_name: '' };
      }

      return null;
    })
    .filter(Boolean);
}

export function validateInvite({ email, full_name }) {
  if (!email || !EMAIL_RE.test(email)) return 'Invalid email';
  if (full_name && full_name.length > 120) return 'Name too long';
  return null;
}

export function dedupeByEmail(invites) {
  const seen = new Set();
  return invites.filter(inv => {
    if (seen.has(inv.email)) return false;
    seen.add(inv.email);
    return true;
  });
}
