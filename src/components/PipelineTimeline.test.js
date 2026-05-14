import { describe, it, expect } from 'vitest';
import { getStage, getMarkerPct, nextHLabel, pad } from './PipelineTimeline.jsx';

// Helper: convert HH:MM to seconds since midnight
function hm(h, m = 0) { return h * 3600 + m * 60; }

// ── getStage ────────────────────────────────────────────────────────────────

describe('getStage', () => {
  it('dead zone: 6am → midnight counts to midnight (nextH 0)', () => {
    const cases = [hm(6), hm(12), hm(18), hm(23), hm(23, 59)];
    cases.forEach(secs => {
      const { nodeIdx, nextH } = getStage(secs);
      expect(nodeIdx).toBe(0);
      expect(nextH).toBe(0);
    });
  });

  it('12am–2am: QUEUE stage, counts to 2am', () => {
    const cases = [hm(0), hm(0, 1), hm(1), hm(1, 59)];
    cases.forEach(secs => {
      const { nodeIdx, nextH } = getStage(secs);
      expect(nodeIdx).toBe(1);
      expect(nextH).toBe(2);
    });
  });

  it('2am–4am: BRIEFS stage, counts to 4am', () => {
    const cases = [hm(2), hm(2, 1), hm(3), hm(3, 59)];
    cases.forEach(secs => {
      const { nodeIdx, nextH } = getStage(secs);
      expect(nodeIdx).toBe(2);
      expect(nextH).toBe(4);
    });
  });

  it('4am–6am: DELIVERED stage, counts to 6am', () => {
    const cases = [hm(4), hm(4, 1), hm(5), hm(5, 59)];
    cases.forEach(secs => {
      const { nodeIdx, nextH } = getStage(secs);
      expect(nodeIdx).toBe(3);
      expect(nextH).toBe(6);
    });
  });

  it('exact stage boundaries flip correctly', () => {
    expect(getStage(hm(0)).nodeIdx).toBe(1);   // midnight → Queue
    expect(getStage(hm(2)).nodeIdx).toBe(2);   // 2am → Briefs
    expect(getStage(hm(4)).nodeIdx).toBe(3);   // 4am → Delivered
    expect(getStage(hm(6)).nodeIdx).toBe(0);   // 6am → Dead zone
  });
});

// ── getMarkerPct ────────────────────────────────────────────────────────────

describe('getMarkerPct', () => {
  it('6am is 0% — rocket resets to start', () => {
    expect(getMarkerPct(hm(6))).toBeCloseTo(0, 4);
  });

  it('midnight is 50% — rocket reaches BOXES gate', () => {
    expect(getMarkerPct(hm(0))).toBeCloseTo(50, 4);
    // wrap: hm(24) overflows to 0 which is midnight
    expect(getMarkerPct(hm(0))).toBeCloseTo(50, 4);
  });

  it('2am is 66.67% — QUEUE gate', () => {
    expect(getMarkerPct(hm(2))).toBeCloseTo(66.667, 2);
  });

  it('4am is 83.33% — BRIEFS gate', () => {
    expect(getMarkerPct(hm(4))).toBeCloseTo(83.333, 2);
  });

  it('6am (end of active run) is 100% — DELIVERED gate', () => {
    // 6am reached from the active run side: secsSince6AM = 86400 - epsilon → nearing 100%
    // At exactly 6am the formula resets to 0. Test one second before.
    expect(getMarkerPct(hm(5, 59) + 59)).toBeCloseTo(100, 0);
  });

  it('11:12pm is ~37.3% — well left of BOXES', () => {
    const pct = getMarkerPct(hm(23, 12));
    expect(pct).toBeGreaterThan(30);
    expect(pct).toBeLessThan(50);
  });

  it('rocket is always between 0 and 100', () => {
    for (let h = 0; h < 24; h++) {
      const pct = getMarkerPct(h * 3600);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});

// ── nextHLabel ──────────────────────────────────────────────────────────────

describe('nextHLabel', () => {
  it('returns 12:00 AM CT for midnight target (dead zone)', () => {
    expect(nextHLabel(0)).toBe('12:00 AM CT');
  });

  it('returns 2:00 AM CT for Queue stage', () => {
    expect(nextHLabel(2)).toBe('2:00 AM CT');
  });

  it('returns 4:00 AM CT for Briefs stage', () => {
    expect(nextHLabel(4)).toBe('4:00 AM CT');
  });

  it('returns 6:00 AM CT for Delivered stage', () => {
    expect(nextHLabel(6)).toBe('6:00 AM CT');
  });
});

// ── pad ─────────────────────────────────────────────────────────────────────

describe('pad', () => {
  it('pads single digits', () => {
    expect(pad(0)).toBe('00');
    expect(pad(5)).toBe('05');
    expect(pad(9)).toBe('09');
  });

  it('leaves double digits alone', () => {
    expect(pad(10)).toBe('10');
    expect(pad(59)).toBe('59');
  });

  it('floors floats', () => {
    expect(pad(5.9)).toBe('05');
  });
});
