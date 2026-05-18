import { describe, it, expect } from 'vitest';
import { EMPTY_FORM, buildPayload, canProceedStep, toFormState } from './wizardHelpers.js';

describe('EMPTY_FORM', () => {
  it('is an object', () => {
    expect(typeof EMPTY_FORM).toBe('object');
    expect(EMPTY_FORM).not.toBeNull();
  });

  it('has all top-level keys', () => {
    expect(EMPTY_FORM).toHaveProperty('assets');
    expect(EMPTY_FORM).toHaveProperty('geo');
    expect(EMPTY_FORM).toHaveProperty('phys');
    expect(EMPTY_FORM).toHaveProperty('fin');
    expect(EMPTY_FORM).toHaveProperty('owner');
    expect(EMPTY_FORM).toHaveProperty('signals');
    expect(EMPTY_FORM).toHaveProperty('logic');
    expect(EMPTY_FORM).toHaveProperty('risk');
    expect(EMPTY_FORM).toHaveProperty('threshold');
    expect(EMPTY_FORM).toHaveProperty('name');
    expect(EMPTY_FORM).toHaveProperty('delivery');
  });

  it('has geo with states/counties/zips as empty arrays', () => {
    expect(Array.isArray(EMPTY_FORM.geo.states)).toBe(true);
    expect(EMPTY_FORM.geo.states).toEqual([]);
    expect(Array.isArray(EMPTY_FORM.geo.counties)).toBe(true);
    expect(EMPTY_FORM.geo.counties).toEqual([]);
    expect(Array.isArray(EMPTY_FORM.geo.zips)).toBe(true);
    expect(EMPTY_FORM.geo.zips).toEqual([]);
  });

  it('has phys with 10 numeric fields all null', () => {
    expect(EMPTY_FORM.phys.sf_min).toBeNull();
    expect(EMPTY_FORM.phys.sf_max).toBeNull();
    expect(EMPTY_FORM.phys.acres_min).toBeNull();
    expect(EMPTY_FORM.phys.acres_max).toBeNull();
    expect(EMPTY_FORM.phys.year_min).toBeNull();
    expect(EMPTY_FORM.phys.year_max).toBeNull();
    expect(EMPTY_FORM.phys.stories_min).toBeNull();
    expect(EMPTY_FORM.phys.stories_max).toBeNull();
    expect(EMPTY_FORM.phys.units_min).toBeNull();
    expect(EMPTY_FORM.phys.units_max).toBeNull();
  });

  it('has fin with equity_preset null and assessed_below_market false', () => {
    expect(EMPTY_FORM.fin.price_min).toBeNull();
    expect(EMPTY_FORM.fin.price_max).toBeNull();
    expect(EMPTY_FORM.fin.equity_preset).toBeNull();
    expect(EMPTY_FORM.fin.assessed_below_market).toBe(false);
  });

  it('threshold defaults to 0.80', () => {
    expect(EMPTY_FORM.threshold).toBe(0.80);
  });
});

describe('canProceedStep', () => {
  describe('step 1: assets and geo.states required', () => {
    it('returns true when assets has items AND geo.states has items', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
      };
      expect(canProceedStep(1, form)).toBe(true);
    });

    it('returns false when assets is empty', () => {
      const form = {
        assets: [],
        geo: { states: ['TX'], counties: [], zips: [] },
      };
      expect(canProceedStep(1, form)).toBe(false);
    });

    it('returns false when geo.states is empty', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: [], counties: [], zips: [] },
      };
      expect(canProceedStep(1, form)).toBe(false);
    });

    it('returns false when both assets and geo.states are empty', () => {
      const form = {
        assets: [],
        geo: { states: [], counties: [], zips: [] },
      };
      expect(canProceedStep(1, form)).toBe(false);
    });
  });

  describe('steps 2-6: always return true', () => {
    const minimalForm = {};

    it('returns true for step 2', () => {
      expect(canProceedStep(2, minimalForm)).toBe(true);
    });

    it('returns true for step 3', () => {
      expect(canProceedStep(3, minimalForm)).toBe(true);
    });

    it('returns true for step 4', () => {
      expect(canProceedStep(4, minimalForm)).toBe(true);
    });

    it('returns true for step 5', () => {
      expect(canProceedStep(5, minimalForm)).toBe(true);
    });

    it('returns true for step 6 (threshold page — name is collected on step 7, not here)', () => {
      expect(canProceedStep(6, minimalForm)).toBe(true);
    });
  });

  describe('step 6: no name gate — name is entered on the step 7 review page', () => {
    it('returns true when name is empty string', () => {
      const form = { name: '' };
      expect(canProceedStep(6, form)).toBe(true);
    });

    it('returns true when name is whitespace only', () => {
      const form = { name: '   ' };
      expect(canProceedStep(6, form)).toBe(true);
    });

    it('returns true when name is null', () => {
      const form = { name: null };
      expect(canProceedStep(6, form)).toBe(true);
    });

    it('returns true when name is non-empty', () => {
      const form = { name: 'My Box' };
      expect(canProceedStep(6, form)).toBe(true);
    });
  });
});

describe('buildPayload', () => {
  describe('assets mapping', () => {
    it('maps assets array to asset_classes and sets asset_class to null', () => {
      const form = {
        assets: ['sfr', 'commercial'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.asset_classes).toEqual(['sfr', 'commercial']);
      expect(payload.asset_class).toBeNull();
    });
  });

  describe('geo mapping', () => {
    it('maps geo.states to geo_states', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX', 'CA'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.geo_states).toEqual(['TX', 'CA']);
    });

    it('maps geo.counties to geo_counties', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: [], counties: ['Harris County'], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.geo_counties).toEqual(['Harris County']);
    });

    it('maps geo.zips to geo_zips', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: [], counties: [], zips: ['77001', '77002'] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.geo_zips).toEqual(['77001', '77002']);
    });
  });

  describe('phys mapping', () => {
    it('maps phys.sf_min to sf_min', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: 1000, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.sf_min).toBe(1000);
    });

    it('maps phys.year_min/max to year_built_min/max', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: 2000, year_max: 2020, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.year_built_min).toBe(2000);
      expect(payload.year_built_max).toBe(2020);
    });

    it('maps all phys fields correctly', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: 1000, sf_max: 5000, acres_min: 1, acres_max: 10, year_min: 2000, year_max: 2020, stories_min: 1, stories_max: 3, units_min: 4, units_max: 12 },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.sf_min).toBe(1000);
      expect(payload.sf_max).toBe(5000);
      expect(payload.acres_min).toBe(1);
      expect(payload.acres_max).toBe(10);
      expect(payload.year_built_min).toBe(2000);
      expect(payload.year_built_max).toBe(2020);
      expect(payload.stories_min).toBe(1);
      expect(payload.stories_max).toBe(3);
      expect(payload.units_min).toBe(4);
      expect(payload.units_max).toBe(12);
    });
  });

  describe('fin mapping', () => {
    it('maps fin.price_min/max to value_min/max', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: 200000, price_max: 1000000, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.value_min).toBe(200000);
      expect(payload.value_max).toBe(1000000);
    });

    it('maps fin.equity_preset 25 to min_equity_pct 25', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: 25, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.min_equity_pct).toBe(25);
    });

    it('maps fin.equity_preset null to min_equity_pct null', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.min_equity_pct).toBeNull();
    });

    it('maps fin.assessed_below_market to assessed_below_market', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: true },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.assessed_below_market).toBe(true);
    });
  });

  describe('owner mapping', () => {
    it('maps owner.entity to owner_types', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: ['individual', 'llc'], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.owner_types).toEqual(['individual', 'llc']);
    });

    it('maps owner.occupancy "absentee" to absentee_only true', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: 'absentee', hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.absentee_only).toBe(true);
    });

    it('maps owner.occupancy other values to absentee_only false', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.absentee_only).toBe(false);
    });

    it('maps owner.hold_min/max to hold_period_min/max', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: 2, hold_max: 5, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.hold_period_min).toBe(2);
      expect(payload.hold_period_max).toBe(5);
    });

    it('maps owner.out_of_state to out_of_state_only', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: true },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.out_of_state_only).toBe(true);
    });
  });

  describe('signals mapping', () => {
    it('maps signals array to distress_signals', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: ['foreclosure', 'ltv', 'arm'],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.distress_signals).toEqual(['foreclosure', 'ltv', 'arm']);
    });
  });

  describe('logic mapping', () => {
    it('maps logic.mode to distress_match_mode', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'and' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.distress_match_mode).toBe('and');
    });
  });

  describe('risk mapping', () => {
    it('maps risk.climate_max to climate_risk_max', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 75, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.climate_risk_max).toBe(75);
    });

    it('maps risk.flood_exclude to flood_exclude', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: true, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.flood_exclude).toBe(true);
    });

    it('maps risk.wildfire_max to wildfire_risk_max', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 80, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.wildfire_risk_max).toBe(80);
    });

    it('maps risk.heat_max to heat_risk_max', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 65 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.heat_risk_max).toBe(65);
    });
  });

  describe('threshold mapping', () => {
    it('maps threshold to match_threshold', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.75,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.match_threshold).toBe(0.75);
    });
  });

  describe('name mapping', () => {
    it('maps name to label', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'My Box Name',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.label).toBe('My Box Name');
    });
  });

  describe('delivery mapping', () => {
    it('maps delivery.cadence "daily" to run_schedule with all 7 days', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.run_schedule.days).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    });

    it('maps delivery.cadence "weekly" to run_schedule with only Monday', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'weekly', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.run_schedule.days).toEqual(['mon']);
    });

    it('maps delivery.cadence "realtime" to run_schedule with all 7 days', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'realtime', max_per_run: 10 },
      };
      const payload = buildPayload(form);
      expect(payload.run_schedule.days).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    });

    it('maps delivery.max_per_run to delivery_max_per_run', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 25 },
      };
      const payload = buildPayload(form);
      expect(payload.delivery_max_per_run).toBe(25);
    });

    it('uses form.delivery.max_per_run not a hardcoded value', () => {
      const make = (max) => ({
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: max },
      });
      expect(buildPayload(make(10)).delivery_max_per_run).toBe(10);
      expect(buildPayload(make(50)).delivery_max_per_run).toBe(50);
      expect(buildPayload(make(1)).delivery_max_per_run).toBe(1);
    });
  });

  describe('complete payload verification', () => {
    it('includes all 13 required fields', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: 1000, sf_max: 5000, acres_min: 1, acres_max: 10, year_min: 2000, year_max: 2020, stories_min: 1, stories_max: 3, units_min: 4, units_max: 12 },
        fin: { price_min: 200000, price_max: 1000000, equity_preset: 25, assessed_below_market: false },
        owner: { entity: ['individual'], occupancy: 'absentee', hold_min: 2, hold_max: 5, out_of_state: false },
        signals: ['foreclosure'],
        logic: { mode: 'and' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.75,
        name: 'Test Box',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);

      expect(payload).toHaveProperty('asset_classes');
      expect(payload).toHaveProperty('asset_class');
      expect(payload).toHaveProperty('geo_states');
      expect(payload).toHaveProperty('sf_min');
      expect(payload).toHaveProperty('sf_max');
      expect(payload).toHaveProperty('acres_min');
      expect(payload).toHaveProperty('acres_max');
      expect(payload).toHaveProperty('year_built_min');
      expect(payload).toHaveProperty('year_built_max');
      expect(payload).toHaveProperty('stories_min');
      expect(payload).toHaveProperty('stories_max');
      expect(payload).toHaveProperty('units_min');
      expect(payload).toHaveProperty('units_max');
      expect(payload).toHaveProperty('value_min');
      expect(payload).toHaveProperty('value_max');
      expect(payload).toHaveProperty('min_equity_pct');
      expect(payload).toHaveProperty('assessed_below_market');
      expect(payload).toHaveProperty('owner_types');
      expect(payload).toHaveProperty('absentee_only');
      expect(payload).toHaveProperty('hold_period_min');
      expect(payload).toHaveProperty('hold_period_max');
      expect(payload).toHaveProperty('out_of_state_only');
      expect(payload).toHaveProperty('distress_signals');
      expect(payload).toHaveProperty('distress_match_mode');
      expect(payload).toHaveProperty('climate_risk_max');
      expect(payload).toHaveProperty('flood_exclude');
      expect(payload).toHaveProperty('wildfire_risk_max');
      expect(payload).toHaveProperty('heat_risk_max');
      expect(payload).toHaveProperty('match_threshold');
      expect(payload).toHaveProperty('label');
      expect(payload).toHaveProperty('run_schedule');
      expect(payload).toHaveProperty('delivery_max_per_run');
    });

    it('handles null fields correctly', () => {
      const form = {
        assets: ['sfr'],
        geo: { states: ['TX'], counties: [], zips: [] },
        phys: { sf_min: null, sf_max: null, acres_min: null, acres_max: null, year_min: null, year_max: null, stories_min: null, stories_max: null, units_min: null, units_max: null },
        fin: { price_min: null, price_max: null, equity_preset: null, assessed_below_market: false },
        owner: { entity: [], occupancy: null, hold_min: null, hold_max: null, out_of_state: false },
        signals: [],
        logic: { mode: 'or' },
        risk: { climate_max: 100, flood_exclude: false, wildfire_max: 100, heat_max: 100 },
        threshold: 0.80,
        name: 'Test',
        delivery: { cadence: 'daily', max_per_run: 10 },
      };
      const payload = buildPayload(form);

      expect(payload.sf_min).toBeNull();
      expect(payload.value_min).toBeNull();
      expect(payload.min_equity_pct).toBeNull();
      expect(payload.hold_period_min).toBeNull();
    });
  });
});

describe('toFormState', () => {
  describe('asset_classes mapping', () => {
    it('maps asset_classes array to assets', () => {
      const buyBox = {
        asset_classes: ['sfr', 'commercial'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.assets).toEqual(['sfr', 'commercial']);
    });

    it('maps asset_classes null to assets empty array', () => {
      const buyBox = {
        asset_classes: null,
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.assets).toEqual([]);
    });
  });

  describe('geo mapping', () => {
    it('maps geo_states to geo.states', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX', 'CA'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.geo.states).toEqual(['TX', 'CA']);
    });

    it('maps geo_states null to geo.states empty array', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: null,
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.geo.states).toEqual([]);
    });

    it('maps geo_counties to geo.counties', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: [],
        geo_counties: ['Harris County', 'Dallas County'],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.geo.counties).toEqual(['Harris County', 'Dallas County']);
    });

    it('maps geo_zips to geo.zips', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: [],
        geo_counties: [],
        geo_zips: ['77001', '77002'],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.geo.zips).toEqual(['77001', '77002']);
    });
  });

  describe('phys mapping', () => {
    it('maps year_built_min/max to phys.year_min/max', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: 2000,
        year_built_max: 2020,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.phys.year_min).toBe(2000);
      expect(form.phys.year_max).toBe(2020);
    });
  });

  describe('fin mapping', () => {
    it('maps value_min/max to fin.price_min/max', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: 200000,
        value_max: 1000000,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.fin.price_min).toBe(200000);
      expect(form.fin.price_max).toBe(1000000);
    });

    it('maps min_equity_pct to fin.equity_preset', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: 25,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.fin.equity_preset).toBe(25);
    });
  });

  describe('owner mapping', () => {
    it('maps absentee_only true to owner.occupancy "absentee"', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: true,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.owner.occupancy).toBe('absentee');
    });

    it('maps absentee_only false to owner.occupancy "owner_occupied"', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.owner.occupancy).toBe('owner_occupied');
    });

    it('maps hold_period_min/max to owner.hold_min/max', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: 2,
        hold_period_max: 5,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.owner.hold_min).toBe(2);
      expect(form.owner.hold_max).toBe(5);
    });
  });

  describe('risk mapping', () => {
    it('maps climate_risk_max to risk.climate_max', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 75,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.risk.climate_max).toBe(75);
    });

    it('maps climate_risk_max null to risk.climate_max 100', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: null,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.risk.climate_max).toBe(100);
    });

    it('maps wildfire_risk_max to risk.wildfire_max', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 80,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.risk.wildfire_max).toBe(80);
    });

    it('maps heat_risk_max to risk.heat_max', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 65,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.risk.heat_max).toBe(65);
    });
  });

  describe('threshold mapping', () => {
    it('maps match_threshold to threshold', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.75,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.threshold).toBe(0.75);
    });

    it('maps match_threshold null to threshold 0.80', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: null,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.threshold).toBe(0.80);
    });
  });

  describe('name mapping', () => {
    it('maps label to name', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'My Box Name',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.name).toBe('My Box Name');
    });
  });

  describe('delivery mapping', () => {
    it('maps run_schedule days length 7 to delivery.cadence "daily"', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.delivery.cadence).toBe('daily');
    });

    it('maps run_schedule days length 1 to delivery.cadence "weekly"', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.delivery.cadence).toBe('weekly');
    });

    it('maps delivery_max_per_run to delivery.max_per_run', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 25,
      };
      const form = toFormState(buyBox);
      expect(form.delivery.max_per_run).toBe(25);
    });

    it('maps delivery_max_per_run null to delivery.max_per_run 5 (EMPTY_FORM default)', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'or',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: null,
      };
      const form = toFormState(buyBox);
      expect(form.delivery.max_per_run).toBe(5);
    });
  });

  describe('logic mapping', () => {
    it('maps distress_match_mode to logic.mode', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: 'and',
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.logic.mode).toBe('and');
    });

    it('maps distress_match_mode null to logic.mode "or"', () => {
      const buyBox = {
        asset_classes: ['sfr'],
        geo_states: ['TX'],
        geo_counties: [],
        geo_zips: [],
        sf_min: null,
        sf_max: null,
        acres_min: null,
        acres_max: null,
        year_built_min: null,
        year_built_max: null,
        stories_min: null,
        stories_max: null,
        units_min: null,
        units_max: null,
        value_min: null,
        value_max: null,
        min_equity_pct: null,
        assessed_below_market: false,
        owner_types: [],
        absentee_only: false,
        hold_period_min: null,
        hold_period_max: null,
        out_of_state_only: false,
        distress_signals: [],
        distress_match_mode: null,
        climate_risk_max: 100,
        flood_exclude: false,
        wildfire_risk_max: 100,
        heat_risk_max: 100,
        match_threshold: 0.80,
        label: 'Test',
        run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        delivery_max_per_run: 10,
      };
      const form = toFormState(buyBox);
      expect(form.logic.mode).toBe('or');
    });
  });
});

describe('Round-trip tests: buildPayload(toFormState(buyBox))', () => {
  it('round-trips minimal buy box', () => {
    const buyBox = {
      asset_classes: ['sfr'],
      geo_states: ['TX'],
      geo_counties: [],
      geo_zips: [],
      sf_min: null,
      sf_max: null,
      acres_min: null,
      acres_max: null,
      year_built_min: null,
      year_built_max: null,
      stories_min: null,
      stories_max: null,
      units_min: null,
      units_max: null,
      value_min: null,
      value_max: null,
      min_equity_pct: null,
      assessed_below_market: false,
      owner_types: [],
      absentee_only: false,
      hold_period_min: null,
      hold_period_max: null,
      out_of_state_only: false,
      distress_signals: [],
      distress_match_mode: 'or',
      climate_risk_max: 100,
      flood_exclude: false,
      wildfire_risk_max: 100,
      heat_risk_max: 100,
      match_threshold: 0.80,
      label: 'Test Box',
      run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
      delivery_max_per_run: 10,
    };

    const form = toFormState(buyBox);
    const payload = buildPayload(form);

    expect(payload.asset_classes).toEqual(['sfr']);
    expect(payload.geo_states).toEqual(['TX']);
    expect(payload.label).toBe('Test Box');
    expect(payload.match_threshold).toBe(0.80);
  });

  it('round-trips full buy box', () => {
    const buyBox = {
      asset_classes: ['sfr', 'commercial'],
      geo_states: ['TX', 'CA'],
      geo_counties: ['Harris County'],
      geo_zips: ['77001'],
      sf_min: 1000,
      sf_max: 5000,
      acres_min: 1,
      acres_max: 10,
      year_built_min: 2000,
      year_built_max: 2020,
      stories_min: 1,
      stories_max: 3,
      units_min: 4,
      units_max: 12,
      value_min: 200000,
      value_max: 1000000,
      min_equity_pct: 25,
      assessed_below_market: false,
      owner_types: ['individual', 'llc'],
      absentee_only: true,
      hold_period_min: 2,
      hold_period_max: 5,
      out_of_state_only: true,
      distress_signals: ['foreclosure', 'ltv'],
      distress_match_mode: 'and',
      climate_risk_max: 75,
      flood_exclude: true,
      wildfire_risk_max: 80,
      heat_risk_max: 65,
      match_threshold: 0.75,
      label: 'Full Box',
      run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
      delivery_max_per_run: 25,
    };

    const form = toFormState(buyBox);
    const payload = buildPayload(form);

    expect(payload.asset_classes).toEqual(['sfr', 'commercial']);
    expect(payload.geo_states).toEqual(['TX', 'CA']);
    expect(payload.geo_counties).toEqual(['Harris County']);
    expect(payload.geo_zips).toEqual(['77001']);
    expect(payload.sf_min).toBe(1000);
    expect(payload.sf_max).toBe(5000);
    expect(payload.acres_min).toBe(1);
    expect(payload.acres_max).toBe(10);
    expect(payload.year_built_min).toBe(2000);
    expect(payload.year_built_max).toBe(2020);
    expect(payload.value_min).toBe(200000);
    expect(payload.value_max).toBe(1000000);
    expect(payload.min_equity_pct).toBe(25);
    expect(payload.owner_types).toEqual(['individual', 'llc']);
    expect(payload.absentee_only).toBe(true);
    expect(payload.hold_period_min).toBe(2);
    expect(payload.hold_period_max).toBe(5);
    expect(payload.out_of_state_only).toBe(true);
    expect(payload.distress_signals).toEqual(['foreclosure', 'ltv']);
    expect(payload.distress_match_mode).toBe('and');
    expect(payload.climate_risk_max).toBe(75);
    expect(payload.flood_exclude).toBe(true);
    expect(payload.wildfire_risk_max).toBe(80);
    expect(payload.heat_risk_max).toBe(65);
    expect(payload.match_threshold).toBe(0.75);
    expect(payload.label).toBe('Full Box');
    expect(payload.delivery_max_per_run).toBe(25);
  });
});
