import { describe, it, expect } from 'vitest';
import { buildPayload, canProceed, activeGeoHasData, toNum } from './wizardHelpers.js';

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

    it('converts undefined to null (NaN case)', () => {
      const result = toNum(undefined);
      expect(Number.isNaN(result) || result === null).toBe(true);
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
    it('returns true when geo_radius_address is non-empty after trim', () => {
      const form = {
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '123 Main St, Nashville, TN',
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
      };
      expect(activeGeoHasData(form)).toBe(false);
    });
  });
});

describe('canProceed', () => {
  describe('step 1: label validation', () => {
    it('returns false when label is empty', () => {
      const form = { label: '', geoMode: 'state', asset_classes: [] };
      expect(canProceed(1, form)).toBe(false);
    });

    it('returns false when label is whitespace-only', () => {
      const form = { label: '   ', geoMode: 'state', asset_classes: [] };
      expect(canProceed(1, form)).toBe(false);
    });

    it('returns true when label has content', () => {
      const form = { label: 'My Box', geoMode: 'state', asset_classes: [] };
      expect(canProceed(1, form)).toBe(true);
    });

    it('returns true when label has leading/trailing spaces (trimmed)', () => {
      const form = { label: '  My Box  ', geoMode: 'state', asset_classes: [] };
      expect(canProceed(1, form)).toBe(true);
    });
  });

  describe('step 2: geo validation', () => {
    it('returns true for state mode with states selected', () => {
      const form = {
        label: 'Box',
        geoMode: 'state',
        geo_states: ['CA'],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceed(2, form)).toBe(true);
    });

    it('returns false for state mode with no states', () => {
      const form = {
        label: 'Box',
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceed(2, form)).toBe(false);
    });

    it('returns true for metro mode with cities selected', () => {
      const form = {
        label: 'Box',
        geoMode: 'metro',
        geo_states: [],
        geo_cities: ['Nashville'],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceed(2, form)).toBe(true);
    });

    it('returns false for metro mode with no cities', () => {
      const form = {
        label: 'Box',
        geoMode: 'metro',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceed(2, form)).toBe(false);
    });

    it('returns true for zip mode with zips selected', () => {
      const form = {
        label: 'Box',
        geoMode: 'zip',
        geo_states: [],
        geo_cities: [],
        geo_zips: ['37201'],
        geo_radius_address: '',
      };
      expect(canProceed(2, form)).toBe(true);
    });

    it('returns false for zip mode with no zips', () => {
      const form = {
        label: 'Box',
        geoMode: 'zip',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceed(2, form)).toBe(false);
    });

    it('returns true for radius mode with address', () => {
      const form = {
        label: 'Box',
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '123 Main St',
      };
      expect(canProceed(2, form)).toBe(true);
    });

    it('returns false for radius mode without address', () => {
      const form = {
        label: 'Box',
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
      };
      expect(canProceed(2, form)).toBe(false);
    });
  });

  describe('step 3: asset class validation', () => {
    it('returns false when no asset classes selected', () => {
      const form = { label: 'Box', asset_classes: [] };
      expect(canProceed(3, form)).toBe(false);
    });

    it('returns true when asset classes selected', () => {
      const form = { label: 'Box', asset_classes: ['Industrial'] };
      expect(canProceed(3, form)).toBe(true);
    });

    it('returns true when multiple asset classes selected', () => {
      const form = { label: 'Box', asset_classes: ['Industrial', 'Retail'] };
      expect(canProceed(3, form)).toBe(true);
    });
  });

  describe('steps 4+: always proceed', () => {
    const minimalForm = { label: 'Box' };

    it('returns true for step 4', () => {
      expect(canProceed(4, minimalForm)).toBe(true);
    });

    it('returns true for step 5', () => {
      expect(canProceed(5, minimalForm)).toBe(true);
    });

    it('returns true for step 6', () => {
      expect(canProceed(6, minimalForm)).toBe(true);
    });

    it('returns true for step 7', () => {
      expect(canProceed(7, minimalForm)).toBe(true);
    });
  });
});

describe('buildPayload', () => {
  describe('basic fields', () => {
    it('includes label with trimmed whitespace', () => {
      const form = {
        label: '  My Box  ',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.label).toBe('My Box');
    });

    it('sets notes to null when empty', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.notes).toBe(null);
    });

    it('includes notes when provided', () => {
      const form = {
        label: 'Box',
        notes: '  Industrial areas only  ',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.notes).toBe('Industrial areas only');
    });

    it('includes asset_classes array', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: ['Industrial', 'Retail'],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.asset_classes).toEqual(['Industrial', 'Retail']);
    });
  });

  describe('geo modes: state', () => {
    it('includes geo_states when geoMode is "state"', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: ['CA', 'TX'],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.geo_states).toEqual(['CA', 'TX']);
      expect(payload.geo_cities).toBeUndefined();
      expect(payload.geo_zips).toBeUndefined();
      expect(payload.geo_radius_address).toBeUndefined();
      expect(payload.geo_radius_miles).toBeUndefined();
    });
  });

  describe('geo modes: metro', () => {
    it('includes geo_cities when geoMode is "metro"', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'metro',
        geo_states: [],
        geo_cities: ['Nashville', 'Atlanta'],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.geo_cities).toEqual(['Nashville', 'Atlanta']);
      expect(payload.geo_states).toBeUndefined();
      expect(payload.geo_zips).toBeUndefined();
      expect(payload.geo_radius_address).toBeUndefined();
    });
  });

  describe('geo modes: zip', () => {
    it('includes geo_zips when geoMode is "zip"', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'zip',
        geo_states: [],
        geo_cities: [],
        geo_zips: ['37201', '37202'],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.geo_zips).toEqual(['37201', '37202']);
      expect(payload.geo_states).toBeUndefined();
      expect(payload.geo_cities).toBeUndefined();
      expect(payload.geo_radius_address).toBeUndefined();
    });
  });

  describe('geo modes: radius', () => {
    it('includes geo_radius_address and geo_radius_miles when geoMode is "radius"', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '123 Main St, Nashville, TN',
        geo_radius_miles: '25',
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
      const payload = buildPayload(form);
      expect(payload.geo_radius_address).toBe('123 Main St, Nashville, TN');
      expect(payload.geo_radius_miles).toBe(25);
      expect(payload.geo_states).toBeUndefined();
      expect(payload.geo_cities).toBeUndefined();
      expect(payload.geo_zips).toBeUndefined();
    });

    it('sets geo_radius_address to null when empty', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'radius',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        geo_radius_miles: '10',
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
      const payload = buildPayload(form);
      expect(payload.geo_radius_address).toBe(null);
    });
  });

  describe('numeric fields', () => {
    it('converts acres_min from string to number', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        acres_min: '50',
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
      const payload = buildPayload(form);
      expect(payload.acres_min).toBe(50);
    });

    it('converts empty acres_max to null', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.acres_max).toBe(null);
    });

    it('converts value fields from string to number', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        acres_min: '',
        acres_max: '',
        value_min: '1000000',
        value_max: '5000000',
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
      const payload = buildPayload(form);
      expect(payload.value_min).toBe(1000000);
      expect(payload.value_max).toBe(5000000);
    });

    it('converts year_built fields', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        acres_min: '',
        acres_max: '',
        value_min: '',
        value_max: '',
        year_built_min: '1990',
        year_built_max: '2010',
        min_hold_yrs: '',
        zoning_codes: [],
        owner_types: [],
        absentee_only: false,
        out_of_state_only: false,
        distress_signals: [],
        distress_only: false,
      };
      const payload = buildPayload(form);
      expect(payload.year_built_min).toBe(1990);
      expect(payload.year_built_max).toBe(2010);
    });

    it('converts min_hold_yrs', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        acres_min: '',
        acres_max: '',
        value_min: '',
        value_max: '',
        year_built_min: '',
        year_built_max: '',
        min_hold_yrs: '5',
        zoning_codes: [],
        owner_types: [],
        absentee_only: false,
        out_of_state_only: false,
        distress_signals: [],
        distress_only: false,
      };
      const payload = buildPayload(form);
      expect(payload.min_hold_yrs).toBe(5);
    });
  });

  describe('array fields: empty to null conversion', () => {
    it('converts empty zoning_codes array to null', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.zoning_codes).toBe(null);
    });

    it('includes zoning_codes when non-empty', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        acres_min: '',
        acres_max: '',
        value_min: '',
        value_max: '',
        year_built_min: '',
        year_built_max: '',
        min_hold_yrs: '',
        zoning_codes: ['C1', 'C2'],
        owner_types: [],
        absentee_only: false,
        out_of_state_only: false,
        distress_signals: [],
        distress_only: false,
      };
      const payload = buildPayload(form);
      expect(payload.zoning_codes).toEqual(['C1', 'C2']);
    });

    it('converts empty owner_types array to null', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.owner_types).toBe(null);
    });

    it('includes owner_types when non-empty', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        acres_min: '',
        acres_max: '',
        value_min: '',
        value_max: '',
        year_built_min: '',
        year_built_max: '',
        min_hold_yrs: '',
        zoning_codes: [],
        owner_types: ['LLC', 'Corp'],
        absentee_only: false,
        out_of_state_only: false,
        distress_signals: [],
        distress_only: false,
      };
      const payload = buildPayload(form);
      expect(payload.owner_types).toEqual(['LLC', 'Corp']);
    });

    it('converts empty distress_signals array to null', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
      const payload = buildPayload(form);
      expect(payload.distress_signals).toBe(null);
    });

    it('includes distress_signals when non-empty', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
        distress_signals: ['foreclosure', 'lien'],
        distress_only: false,
      };
      const payload = buildPayload(form);
      expect(payload.distress_signals).toEqual(['foreclosure', 'lien']);
    });
  });

  describe('boolean fields', () => {
    it('includes absentee_only flag', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
        acres_min: '',
        acres_max: '',
        value_min: '',
        value_max: '',
        year_built_min: '',
        year_built_max: '',
        min_hold_yrs: '',
        zoning_codes: [],
        owner_types: [],
        absentee_only: true,
        out_of_state_only: false,
        distress_signals: [],
        distress_only: false,
      };
      const payload = buildPayload(form);
      expect(payload.absentee_only).toBe(true);
    });

    it('includes out_of_state_only flag', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
        out_of_state_only: true,
        distress_signals: [],
        distress_only: false,
      };
      const payload = buildPayload(form);
      expect(payload.out_of_state_only).toBe(true);
    });

    it('includes distress_only flag', () => {
      const form = {
        label: 'Box',
        notes: '',
        asset_classes: [],
        geoMode: 'state',
        geo_states: [],
        geo_cities: [],
        geo_zips: [],
        geo_radius_address: '',
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
        distress_only: true,
      };
      const payload = buildPayload(form);
      expect(payload.distress_only).toBe(true);
    });
  });

  describe('complete payload example', () => {
    it('builds complete payload with all fields populated', () => {
      const form = {
        label: '  Industrial - Metro  ',
        notes: '  Focused on Nashville area  ',
        asset_classes: ['Industrial', 'Outdoor'],
        geoMode: 'metro',
        geo_states: [],
        geo_cities: ['Nashville', 'Atlanta'],
        geo_zips: [],
        geo_radius_address: '',
        geo_radius_miles: '',
        acres_min: '50',
        acres_max: '500',
        value_min: '500000',
        value_max: '5000000',
        year_built_min: '1980',
        year_built_max: '2015',
        min_hold_yrs: '5',
        zoning_codes: ['C1', 'M1'],
        owner_types: ['LLC'],
        absentee_only: true,
        out_of_state_only: false,
        distress_signals: ['foreclosure'],
        distress_only: false,
      };
      const payload = buildPayload(form);

      expect(payload).toEqual({
        label: 'Industrial - Metro',
        notes: 'Focused on Nashville area',
        asset_classes: ['Industrial', 'Outdoor'],
        geo_cities: ['Nashville', 'Atlanta'],
        acres_min: 50,
        acres_max: 500,
        value_min: 500000,
        value_max: 5000000,
        year_built_min: 1980,
        year_built_max: 2015,
        min_hold_yrs: 5,
        zoning_codes: ['C1', 'M1'],
        owner_types: ['LLC'],
        absentee_only: true,
        out_of_state_only: false,
        distress_signals: ['foreclosure'],
        distress_only: false,
      });
    });
  });
});
