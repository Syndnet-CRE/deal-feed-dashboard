import { describe, it, expect } from 'vitest';
import { fmtMoney, scoreClass, fmt, hasVal, fmtRelativeTime, freshnessColor, agingColor } from './format.js';

describe('fmtMoney', () => {
  describe('null and undefined handling', () => {
    it('returns "—" for null', () => {
      expect(fmtMoney(null)).toBe('—');
    });

    it('returns "—" for undefined', () => {
      expect(fmtMoney(undefined)).toBe('—');
    });
  });

  describe('zero and small numbers', () => {
    it('returns "$0" for zero', () => {
      expect(fmtMoney(0)).toBe('$0');
    });

    it('handles single digit correctly', () => {
      expect(fmtMoney(5)).toBe('$5');
    });

    it('handles two digit numbers correctly', () => {
      expect(fmtMoney(42)).toBe('$42');
    });
  });

  describe('negative numbers', () => {
    it('handles negative numbers without crashing', () => {
      expect(fmtMoney(-500)).toBe('$-500');
    });

    it('formats negative millions as full number (not >= comparison)', () => {
      // -1500000 >= 1_000_000 is false, so it uses toLocaleString
      expect(fmtMoney(-1500000)).toBe('$-1,500,000');
    });

    it('formats negative thousands as full number (not >= comparison)', () => {
      // -5000 >= 1_000 is false, so it uses toLocaleString
      expect(fmtMoney(-5000)).toBe('$-5,000');
    });
  });

  describe('$1K threshold (1000 boundary)', () => {
    it('formats 999 with full precision', () => {
      expect(fmtMoney(999)).toBe('$999');
    });

    it('formats 1000 as $1K', () => {
      expect(fmtMoney(1000)).toBe('$1K');
    });

    it('formats 1500 as $2K (rounded)', () => {
      expect(fmtMoney(1500)).toBe('$2K');
    });

    it('formats 5000 as $5K', () => {
      expect(fmtMoney(5000)).toBe('$5K');
    });
  });

  describe('$1M threshold (1,000,000 boundary)', () => {
    it('formats 999999 as $1000K', () => {
      expect(fmtMoney(999999)).toBe('$1000K');
    });

    it('formats 1000000 as $1.00M', () => {
      expect(fmtMoney(1000000)).toBe('$1.00M');
    });

    it('formats 1500000 as $1.50M', () => {
      expect(fmtMoney(1500000)).toBe('$1.50M');
    });

    it('formats 2340000 as $2.34M', () => {
      expect(fmtMoney(2340000)).toBe('$2.34M');
    });

    it('formats large millions correctly', () => {
      expect(fmtMoney(50000000)).toBe('$50.00M');
    });
  });

  describe('NaN handling', () => {
    it('does not crash with NaN', () => {
      const result = fmtMoney(NaN);
      expect(result).toBeDefined();
    });

    it('returns "—" for NaN', () => {
      expect(fmtMoney(NaN)).toBe('—');
    });

    it('returns "—" for Infinity', () => {
      expect(fmtMoney(Infinity)).toBe('—');
    });

    it('returns "—" for -Infinity', () => {
      expect(fmtMoney(-Infinity)).toBe('—');
    });
  });

  describe('string inputs', () => {
    it('does not crash with string "null"', () => {
      const result = fmtMoney('null');
      expect(result).toBeDefined();
    });

    it('coerces string "500" to number-like behavior', () => {
      // String "500" >= 1_000_000 is false (string comparison), so it goes to toLocaleString
      const result = fmtMoney('500');
      expect(result).toBeDefined();
    });
  });
});

describe('scoreClass', () => {
  describe('null and undefined handling', () => {
    it('returns "lo" for null', () => {
      expect(scoreClass(null)).toBe('lo');
    });

    it('returns "lo" for undefined', () => {
      expect(scoreClass(undefined)).toBe('lo');
    });
  });

  describe('boundary at 80 (hi threshold)', () => {
    it('returns "hi" for exactly 80', () => {
      expect(scoreClass(80)).toBe('hi');
    });

    it('returns "hi" for 85', () => {
      expect(scoreClass(85)).toBe('hi');
    });

    it('returns "hi" for 100', () => {
      expect(scoreClass(100)).toBe('hi');
    });

    it('returns "md" for 79', () => {
      expect(scoreClass(79)).toBe('md');
    });
  });

  describe('boundary at 60 (md threshold)', () => {
    it('returns "md" for exactly 60', () => {
      expect(scoreClass(60)).toBe('md');
    });

    it('returns "md" for 70', () => {
      expect(scoreClass(70)).toBe('md');
    });

    it('returns "lo" for 59', () => {
      expect(scoreClass(59)).toBe('lo');
    });
  });

  describe('low range', () => {
    it('returns "lo" for 0', () => {
      expect(scoreClass(0)).toBe('lo');
    });

    it('returns "lo" for 50', () => {
      expect(scoreClass(50)).toBe('lo');
    });

    it('returns "lo" for negative scores', () => {
      expect(scoreClass(-10)).toBe('lo');
    });
  });

  describe('NaN handling', () => {
    it('does not crash with NaN', () => {
      const result = scoreClass(NaN);
      expect(result).toBeDefined();
    });

    it('returns "lo" for NaN', () => {
      // NaN >= 80 is false, NaN >= 60 is false, so returns "lo"
      expect(scoreClass(NaN)).toBe('lo');
    });
  });
});

describe('fmt', () => {
  describe('null and undefined handling', () => {
    it('returns "—" for null', () => {
      expect(fmt(null)).toBe('—');
    });

    it('returns "—" for undefined', () => {
      expect(fmt(undefined)).toBe('—');
    });
  });

  describe('empty string handling', () => {
    it('returns "—" for empty string', () => {
      expect(fmt('')).toBe('—');
    });
  });

  describe('string "null" and "undefined" handling', () => {
    it('returns "—" for string "null"', () => {
      expect(fmt('null')).toBe('—');
    });

    it('returns "—" for string "undefined"', () => {
      expect(fmt('undefined')).toBe('—');
    });
  });

  describe('valid values', () => {
    it('returns "0" for number 0', () => {
      expect(fmt(0)).toBe('0');
    });

    it('returns "42" for number 42', () => {
      expect(fmt(42)).toBe('42');
    });

    it('returns the same string for normal strings', () => {
      expect(fmt('hello')).toBe('hello');
    });

    it('preserves strings with spaces', () => {
      expect(fmt('hello world')).toBe('hello world');
    });

    it('handles negative numbers correctly', () => {
      expect(fmt(-100)).toBe('-100');
    });

    it('converts boolean true to string', () => {
      expect(fmt(true)).toBe('true');
    });

    it('converts boolean false to string', () => {
      expect(fmt(false)).toBe('false');
    });

    it('handles very long strings', () => {
      const longStr = 'a'.repeat(1000);
      expect(fmt(longStr)).toBe(longStr);
    });
  });

  describe('edge cases', () => {
    it('handles whitespace-only strings', () => {
      expect(fmt('   ')).toBe('   ');
    });

    it('handles strings that look like numbers', () => {
      expect(fmt('123')).toBe('123');
    });

    it('handles decimal strings', () => {
      expect(fmt('3.14')).toBe('3.14');
    });

    it('handles objects converted to string', () => {
      const result = fmt({});
      expect(result).toBe('[object Object]');
    });

    it('handles arrays converted to string', () => {
      expect(fmt([1, 2, 3])).toBe('1,2,3');
    });
  });
});

describe('hasVal', () => {
  describe('falsy values that return false', () => {
    it('returns false for null', () => {
      expect(hasVal(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(hasVal(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasVal('')).toBe(false);
    });

    it('returns false for string "null"', () => {
      expect(hasVal('null')).toBe(false);
    });

    it('returns false for string "undefined"', () => {
      expect(hasVal('undefined')).toBe(false);
    });
  });

  describe('valid values that return true', () => {
    it('returns true for 0 (zero is a valid value)', () => {
      expect(hasVal(0)).toBe(true);
    });

    it('returns true for false (false is a valid value)', () => {
      expect(hasVal(false)).toBe(true);
    });

    it('returns true for normal strings', () => {
      expect(hasVal('hello')).toBe(true);
    });

    it('returns true for number 42', () => {
      expect(hasVal(42)).toBe(true);
    });

    it('returns true for negative numbers', () => {
      expect(hasVal(-100)).toBe(true);
    });

    it('returns true for string "0"', () => {
      expect(hasVal('0')).toBe(true);
    });

    it('returns true for string "false"', () => {
      expect(hasVal('false')).toBe(true);
    });

    it('returns true for whitespace-only strings', () => {
      expect(hasVal('   ')).toBe(true);
    });

    it('returns true for objects', () => {
      expect(hasVal({})).toBe(true);
    });

    it('returns true for arrays', () => {
      expect(hasVal([])).toBe(true);
    });

    it('returns true for true', () => {
      expect(hasVal(true)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns true for NaN (NaN != null is true)', () => {
      expect(hasVal(NaN)).toBe(true);
    });

    it('returns true for Infinity', () => {
      expect(hasVal(Infinity)).toBe(true);
    });

    it('returns true for negative Infinity', () => {
      expect(hasVal(-Infinity)).toBe(true);
    });
  });
});

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('fmtRelativeTime', () => {
  it('returns null for null', () => {
    expect(fmtRelativeTime(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(fmtRelativeTime('')).toBeNull();
  });

  it('returns null for unparseable string', () => {
    expect(fmtRelativeTime('not-a-date')).toBeNull();
  });

  it('returns Today for today', () => {
    const result = fmtRelativeTime(daysAgoStr(0));
    expect(result).not.toBeNull();
    expect(result.days).toBe(0);
    expect(result.label).toBe('Today');
  });

  it('returns 1 day ago for yesterday', () => {
    const result = fmtRelativeTime(daysAgoStr(1));
    expect(result.days).toBe(1);
    expect(result.label).toBe('1 day ago');
  });

  it('returns N days ago for 6 days (green zone)', () => {
    const result = fmtRelativeTime(daysAgoStr(6));
    expect(result.days).toBe(6);
    expect(result.label).toBe('6 days ago');
  });

  it('returns N days ago for 8 days (amber zone)', () => {
    const result = fmtRelativeTime(daysAgoStr(8));
    expect(result.days).toBe(8);
    expect(result.label).toBe('8 days ago');
  });

  it('returns N days ago for 31 days (muted zone)', () => {
    const result = fmtRelativeTime(daysAgoStr(31));
    expect(result.days).toBe(31);
    expect(result.label).toBe('31 days ago');
  });
});

describe('freshnessColor', () => {
  it('returns null for null', () => {
    expect(freshnessColor(null)).toBeNull();
  });

  it('returns green for 0 days', () => {
    expect(freshnessColor(0)).toBe('var(--green)');
  });

  it('returns green for 7 days (boundary)', () => {
    expect(freshnessColor(7)).toBe('var(--green)');
  });

  it('returns warning for 8 days', () => {
    expect(freshnessColor(8)).toBe('var(--warning)');
  });

  it('returns warning for 30 days (boundary)', () => {
    expect(freshnessColor(30)).toBe('var(--warning)');
  });

  it('returns ink-4 for 31 days', () => {
    expect(freshnessColor(31)).toBe('var(--ink-4)');
  });

  it('returns ink-4 for very old dates', () => {
    expect(freshnessColor(365)).toBe('var(--ink-4)');
  });
});

describe('agingColor', () => {
  it('returns null for null', () => {
    expect(agingColor(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(agingColor(undefined)).toBeNull();
  });

  it('returns green for 0 days', () => {
    expect(agingColor(0)).toBe('var(--green)');
  });

  it('returns green for 7 days (boundary)', () => {
    expect(agingColor(7)).toBe('var(--green)');
  });

  it('returns warning for 8 days', () => {
    expect(agingColor(8)).toBe('var(--warning)');
  });

  it('returns warning for 30 days (boundary)', () => {
    expect(agingColor(30)).toBe('var(--warning)');
  });

  it('returns ink-4 for 31 days', () => {
    expect(agingColor(31)).toBe('var(--ink-4)');
  });

  it('returns ink-4 for very old deals', () => {
    expect(agingColor(365)).toBe('var(--ink-4)');
  });
});
