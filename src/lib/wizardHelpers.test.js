import { describe, it, expect } from 'vitest';
import { buildPayload, canProceedStep, activeGeoHasData, toNum } from './wizardHelpers.js';

// Base form used in buildPayload tests — all optional fields at defaults
const baseForm = {
  label: 'Box',
  notes: '',
  asset_class: null,
  asset_use_codes: [],
  asset_classes: null,
  run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  geoMode: 'state',
  geo_states: [],
  geo_cities: [],
  geo_zips: [],
  geo_radius_address: '',
  geo_radius_miles: '',
  sf_min: '',
  sf_max: '',
  acres_min: '',
  acres_max: '',
  value_min: '',
  value_max: '',
  year_built_min: '',
  year_built_max: '',
  min_hold_yrs: '',
  zoning_codes: [],
  owner_types: [],
  absentee_only: false,
  out_of_state_only: false,
  distress_signals: [],
  distress_only: false,
};

describe('toNum', () => {
  describe('empty string handling', () => {
    it('converts empty string to null', () => {
      expect(toNum('')).toBe(null);
    });
  });

  describe('valid numbers', () => {
    it('converts string "42" to number 42', () => {
      expect(toNum('42')).toBe(42);
    });

    it('converts string "1500" to number 1500', () => {
      expect(toNum('1500')).toBe(1500);
    });

    it('converts string "0" to number 0', () => {
      expect(toNum('0')).toBe(0);
    });

    it('converts negative number strings', () => {
      expect(toNum('-100')).toBe(-100);
    });
  });

  describe('decimal numbers', () => {
    it('converts string "3.14" to 3.14', () => {
      expect(toNum('3.14')).toBe(3.14);
    });
  });

  describe('null and undefined', () => {
    it('converts null to null', () => {
      expect(toNum(null)).toBe(null);
    });

    it('converts undefined to null', () => {
      expect(toNum(undefined)).toBe(null);
    });

    it('converts Infinity to null', () => {
      expect(toNum(Infinity)).toBe(null);
    });

    it('converts NaN string to null', () => {
      expect(toNum('abc')).toBe(null);
    });
  });
});

describe('activeGeoHasData', () => {
  describe('state mode', () => {
    it('returns true when geo_states has items', () => {
      const form = {
        geoMode: 'state',
        geo_states: ['CA', 'TX'],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(activeGeoHasData(form)).toBe(true);
    });

    it('returns false when geo_states is empty', () => {
      const form = {
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(activeGeoHasData(form)).toBe(false);
    });
  });

  describe('metro mode', () => {
    it('returns true when geo_cities has items', () => {
      const form = {
        geoMode: 'metro',
        geo_states: [],
        geo_cities: ['Nashville', 'Atlanta'],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(activeGeoHasData(form)).toBe(true);
    });

    it('returns false when geo_cities is empty', () => {
      const form = {
        geoMode: 'metro',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(activeGeoHasData(form)).toBe(false);
    });
  });

  describe('zip mode', () => {
    it('returns true when geo_zips has items', () => {
      const form = {
        geoMode: 'zip',
        geo_states: [],
        geo_cities: [],
        geo_zips: ['37201', '37202'],
        geo_radius_address: '',
      };
      expect(activeGeoHasData(form)).toBe(true);
    });

    it('returns false when geo_zips is empty', () => {
      const form = {
        geoMode: 'zip',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(activeGeoHasData(form)).toBe(false);
    });
  });

  describe('radius mode', () => {
    it('returns true when address and miles are both set', () => {
      const form = {
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '123 Main St, Nashville, TN',
        geo_radius_miles: '35',
      };
      expect(activeGeoHasData(form)).toBe(true);
    });

    it('returns false when geo_radius_address is empty', () => {
      const form = {
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        geo_radius_miles: '35',
      };
      expect(activeGeoHasData(form)).toBe(false);
    });

    it('returns false when geo_radius_address is whitespace-only', () => {
      const form = {
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '   ',
        geo_radius_miles: '35',
      };
      expect(activeGeoHasData(form)).toBe(false);
    });

    it('returns false when address is set but miles is empty', () => {
      const form = {
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '123 Main St, Nashville, TN',
        geo_radius_miles: '',
      };
      expect(activeGeoHasData(form)).toBe(false);
    });
  });
});

describe('canProceedStep', () => {
  describe('step 1: label validation', () => {
    it('returns false when label is empty', () => {
      const form = { label: '' };
      expect(canProceedStep(1, form)).toBe(false);
    });

    it('returns false when label is whitespace-only', () => {
      const form = { label: '   ' };
      expect(canProceedStep(1, form)).toBe(false);
    });

    it('returns true when label has content', () => {
      const form = { label: 'My Box' };
      expect(canProceedStep(1, form)).toBe(true);
    });

    it('trims label before checking', () => {
      const form = { label: '  My Box  ' };
      expect(canProceedStep(1, form)).toBe(true);
    });
  });

  describe('step 2: geo validation', () => {
    it('returns true for state mode with states selected', () => {
      const form = {
        geoMode: 'state',
        geo_states: ['CA'],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceedStep(2, form)).toBe(true);
    });

    it('returns false for state mode with no states', () => {
      const form = {
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceedStep(2, form)).toBe(false);
    });

    it('returns true for metro mode with cities selected', () => {
      const form = {
        geoMode: 'metro',
        geo_states: [],
        geo_cities: ['Nashville'],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceedStep(2, form)).toBe(true);
    });

    it('returns true for zip mode with zips selected', () => {
      const form = {
        geoMode: 'zip',
        geo_states: [],
        geo_cities: [],
        geo_zips: ['37201'],
        geo_radius_address: '',
      };
      expect(canProceedStep(2, form)).toBe(true);
    });

    it('returns true for radius mode with address and miles', () => {
      const form = {
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '123 Main St',
        geo_radius_miles: '35',
      };
      expect(canProceedStep(2, form)).toBe(true);
    });

    it('returns false for radius mode without address', () => {
      const form = {
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        geo_radius_miles: '35',
      };
      expect(canProceedStep(2, form)).toBe(false);
    });
  });

  describe('step 3: asset class — single string required', () => {
    it('returns false when asset_class is null', () => {
      expect(canProceedStep(3, { asset_class: null })).toBe(false);
    });

    it('returns false when asset_class is empty string', () => {
      expect(canProceedStep(3, { asset_class: '' })).toBe(false);
    });

    it('returns false when asset_class is undefined', () => {
      expect(canProceedStep(3, {})).toBe(false);
    });

    it('returns true when asset_class is a valid class id', () => {
      expect(canProceedStep(3, { asset_class: 'industrial' })).toBe(true);
    });

    it('returns true for any non-empty string', () => {
      expect(canProceedStep(3, { asset_class: 'multifamily' })).toBe(true);
    });
  });

  describe('step 4: sub-asset class — at least one use code required', () => {
    it('returns false when asset_use_codes is undefined', () => {
      expect(canProceedStep(4, {})).toBe(false);
    });

    it('returns false when asset_use_codes is empty array', () => {
      expect(canProceedStep(4, { asset_use_codes: [] })).toBe(false);
    });

    it('returns true when asset_use_codes has one code', () => {
      expect(canProceedStep(4, { asset_use_codes: [238] })).toBe(true);
    });

    it('returns true when asset_use_codes has multiple codes', () => {
      expect(canProceedStep(4, { asset_use_codes: [212, 238, 220] })).toBe(true);
    });
  });

  describe('steps 5, 6, 7, 9: always proceed', () => {
    const minimalForm = {};

    it('returns true for step 5 (criteria — all optional)', () => {
      expect(canProceedStep(5, minimalForm)).toBe(true);
    });

    it('returns true for step 6 (ownership — all optional)', () => {
      expect(canProceedStep(6, minimalForm)).toBe(true);
    });

    it('returns true for step 7 (distress — all optional)', () => {
      expect(canProceedStep(7, minimalForm)).toBe(true);
    });

    it('returns true for step 9 (review)', () => {
      expect(canProceedStep(9, minimalForm)).toBe(true);
    });
  });

  describe('step 8: schedule — at least one day required', () => {
    it('returns false when run_schedule is undefined', () => {
      expect(canProceedStep(8, {})).toBe(false);
    });

    it('returns false when run_schedule.days is empty', () => {
      expect(canProceedStep(8, { run_schedule: { days: [] } })).toBe(false);
    });

    it('returns true when run_schedule.days has one day', () => {
      expect(canProceedStep(8, { run_schedule: { days: ['mon'] } })).toBe(true);
    });

    it('returns true when run_schedule.days has all 7 days', () => {
      expect(canProceedStep(8, {
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
      })).toBe(true);
    });
  });

});

describe('buildPayload', () => {
  describe('basic fields', () => {
    it('includes label with trimmed whitespace', () => {
      const payload = buildPayload({ ...baseForm, label: '  My Box  ' });
      expect(payload.label).toBe('My Box');
    });

    it('sets notes to null when empty', () => {
      const payload = buildPayload({ ...baseForm, notes: '' });
      expect(payload.notes).toBe(null);
    });

    it('includes notes when provided', () => {
      const payload = buildPayload({ ...baseForm, notes: '  Industrial areas only  ' });
      expect(payload.notes).toBe('Industrial areas only');
    });
  });

  describe('asset class fields', () => {
    it('includes asset_class', () => {
      const payload = buildPayload({ ...baseForm, asset_class: 'industrial' });
      expect(payload.asset_class).toBe('industrial');
    });

    it('sets asset_class to null when falsy', () => {
      const payload = buildPayload({ ...baseForm, asset_class: null });
      expect(payload.asset_class).toBe(null);
    });

    it('includes asset_use_codes array', () => {
      const payload = buildPayload({ ...baseForm, asset_use_codes: [212, 238] });
      expect(payload.asset_use_codes).toEqual([212, 238]);
    });

    it('includes empty array for asset_use_codes when none selected', () => {
      const payload = buildPayload({ ...baseForm, asset_use_codes: [] });
      expect(payload.asset_use_codes).toEqual([]);
    });

    it('includes asset_classes for backward compat when provided', () => {
      const payload = buildPayload({ ...baseForm, asset_classes: ['industrial'] });
      expect(payload.asset_classes).toEqual(['industrial']);
    });

    it('sets asset_classes to null when empty', () => {
      const payload = buildPayload({ ...baseForm, asset_classes: [] });
      expect(payload.asset_classes).toBe(null);
    });
  });

  describe('run_schedule', () => {
    it('includes run_schedule when set', () => {
      const schedule = { days: ['mon', 'wed', 'fri'] };
      const payload = buildPayload({ ...baseForm, run_schedule: schedule });
      expect(payload.run_schedule).toEqual(schedule);
    });

    it('defaults to all 7 days when run_schedule is null', () => {
      const payload = buildPayload({ ...baseForm, run_schedule: null });
      expect(payload.run_schedule).toEqual({
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      });
    });
  });

  describe('geo modes: state', () => {
    it('includes geo_states when geoMode is "state"', () => {
      const payload = buildPayload({ ...baseForm, geoMode: 'state', geo_states: ['CA', 'TX'] });
      expect(payload.geo_states).toEqual(['CA', 'TX']);
      expect(payload.geo_cities).toBeUndefined();
      expect(payload.geo_zips).toBeUndefined();
      expect(payload.geo_radius_address).toBeUndefined();
      expect(payload.geo_radius_miles).toBeUndefined();
    });
  });

  describe('geo modes: metro', () => {
    it('includes geo_cities when geoMode is "metro"', () => {
      const payload = buildPayload({
        ...baseForm, geoMode: 'metro', geo_cities: ['Nashville', 'Atlanta'],
      });
      expect(payload.geo_cities).toEqual(['Nashville', 'Atlanta']);
      expect(payload.geo_states).toBeUndefined();
      expect(payload.geo_zips).toBeUndefined();
    });
  });

  describe('geo modes: zip', () => {
    it('includes geo_zips when geoMode is "zip"', () => {
      const payload = buildPayload({
        ...baseForm, geoMode: 'zip', geo_zips: ['37201', '37202'],
      });
      expect(payload.geo_zips).toEqual(['37201', '37202']);
      expect(payload.geo_states).toBeUndefined();
      expect(payload.geo_cities).toBeUndefined();
    });
  });

  describe('geo modes: radius', () => {
    it('includes radius fields when geoMode is "radius"', () => {
      const payload = buildPayload({
        ...baseForm,
        geoMode: 'radius',
        geo_radius_address: '123 Main St, Nashville, TN',
        geo_radius_miles: '25',
        geo_radius_lat: 36.1627,
        geo_radius_lng: -86.7816,
      });
      expect(payload.geo_radius_address).toBe('123 Main St, Nashville, TN');
      expect(payload.geo_radius_miles).toBe(25);
      expect(payload.geo_radius_lat).toBe(36.1627);
      expect(payload.geo_radius_lng).toBe(-86.7816);
      expect(payload.geo_states).toBeUndefined();
    });

    it('sets geo_radius_address to null when empty', () => {
      const payload = buildPayload({
        ...baseForm,
        geoMode: 'radius',
        geo_radius_address: '',
        geo_radius_miles: '10',
      });
      expect(payload.geo_radius_address).toBe(null);
    });
  });

  describe('numeric fields', () => {
    it('converts sf_min and sf_max from string to number', () => {
      const payload = buildPayload({ ...baseForm, sf_min: '5000', sf_max: '50000' });
      expect(payload.sf_min).toBe(5000);
      expect(payload.sf_max).toBe(50000);
    });

    it('converts empty sf fields to null', () => {
      const payload = buildPayload({ ...baseForm, sf_min: '', sf_max: '' });
      expect(payload.sf_min).toBe(null);
      expect(payload.sf_max).toBe(null);
    });

    it('converts acres_min from string to number', () => {
      const payload = buildPayload({ ...baseForm, acres_min: '50' });
      expect(payload.acres_min).toBe(50);
    });

    it('converts empty acres_max to null', () => {
      const payload = buildPayload({ ...baseForm, acres_max: '' });
      expect(payload.acres_max).toBe(null);
    });

    it('converts value fields', () => {
      const payload = buildPayload({ ...baseForm, value_min: '1000000', value_max: '5000000' });
      expect(payload.value_min).toBe(1000000);
      expect(payload.value_max).toBe(5000000);
    });

    it('converts year_built fields', () => {
      const payload = buildPayload({ ...baseForm, year_built_min: '1990', year_built_max: '2010' });
      expect(payload.year_built_min).toBe(1990);
      expect(payload.year_built_max).toBe(2010);
    });

    it('converts min_hold_yrs', () => {
      const payload = buildPayload({ ...baseForm, min_hold_yrs: '5' });
      expect(payload.min_hold_yrs).toBe(5);
    });
  });

  describe('array fields: empty to null conversion', () => {
    it('converts empty zoning_codes array to null', () => {
      expect(buildPayload(baseForm).zoning_codes).toBe(null);
    });

    it('includes zoning_codes when non-empty', () => {
      expect(buildPayload({ ...baseForm, zoning_codes: ['C1', 'C2'] }).zoning_codes)
        .toEqual(['C1', 'C2']);
    });

    it('converts empty owner_types array to null', () => {
      expect(buildPayload(baseForm).owner_types).toBe(null);
    });

    it('includes owner_types when non-empty', () => {
      expect(buildPayload({ ...baseForm, owner_types: ['LLC', 'Corp'] }).owner_types)
        .toEqual(['LLC', 'Corp']);
    });

    it('converts empty distress_signals array to null', () => {
      expect(buildPayload(baseForm).distress_signals).toBe(null);
    });

    it('includes distress_signals when non-empty', () => {
      expect(buildPayload({ ...baseForm, distress_signals: ['foreclosure', 'lien'] }).distress_signals)
        .toEqual(['foreclosure', 'lien']);
    });
  });

  describe('boolean fields', () => {
    it('includes absentee_only flag', () => {
      expect(buildPayload({ ...baseForm, absentee_only: true }).absentee_only).toBe(true);
    });

    it('includes out_of_state_only flag', () => {
      expect(buildPayload({ ...baseForm, out_of_state_only: true }).out_of_state_only).toBe(true);
    });

    it('includes distress_only flag', () => {
      expect(buildPayload({ ...baseForm, distress_only: true }).distress_only).toBe(true);
    });
  });

  describe('complete payload example', () => {
    it('builds complete payload with all fields populated', () => {
      const form = {
        label: '  Industrial - Nashville  ',
        notes: '  Focused on Nashville area  ',
        asset_class: 'industrial',
        asset_use_codes: [212, 238],
        asset_classes: ['industrial'],
        run_schedule: { days: ['mon', 'wed', 'fri'] },
        geoMode: 'metro',
        geo_states: [],
        geo_cities: ['Nashville', 'Atlanta'],
        geo_zips: [],
        geo_radius_address: '',
        geo_radius_miles: '',
        sf_min: '5000',
        sf_max: '',
        acres_min: '50',
        acres_max: '500',
        value_min: '500000',
        value_max: '5000000',
        year_built_min: '1980',
        year_built_max: '2015',
        min_hold_yrs: '5',
        zoning_codes: ['C1', 'M1'],
        owner_types: ['llc'],
        absentee_only: true,
        out_of_state_only: false,
        distress_signals: ['active-foreclosure'],
        distress_only: false,
      };

      const payload = buildPayload(form);

      expect(payload).toEqual({
        label: 'Industrial - Nashville',
        notes: 'Focused on Nashville area',
        asset_class: 'industrial',
        asset_use_codes: [212, 238],
        asset_classes: ['industrial'],
        run_schedule: { days: ['mon', 'wed', 'fri'] },
        geo_cities: ['Nashville', 'Atlanta'],
        sf_min: 5000,
        sf_max: null,
        acres_min: 50,
        acres_max: 500,
        value_min: 500000,
        value_max: 5000000,
        year_built_min: 1980,
        year_built_max: 2015,
        min_hold_yrs: 5,
        zoning_codes: ['C1', 'M1'],
        owner_types: ['llc'],
        absentee_only: true,
        out_of_state_only: false,
        distress_signals: ['active-foreclosure'],
        distress_only: false,
      });
    });
  });
});
