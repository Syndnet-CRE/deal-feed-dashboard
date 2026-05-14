/**
 * EMPTY_FORM constant — the initial state structure for the buy box wizard.
 * All fields initialized with sensible defaults.
 */
export const EMPTY_FORM = {
  assets: [],
  geo: {
    states: [],
    counties: [],
    zips: [],
  },
  phys: {
    sf_min: null,
    sf_max: null,
    acres_min: null,
    acres_max: null,
    year_min: null,
    year_max: null,
    stories_min: null,
    stories_max: null,
    units_min: null,
    units_max: null,
    zoning_codes: [],
  },
  fin: {
    price_min: null,
    price_max: null,
    equity_preset: null,
    assessed_below_market: false,
  },
  owner: {
    entity: [],
    occupancy: null,
    hold_min: null,
    hold_max: null,
    out_of_state: false,
  },
  signals: [],
  logic: {
    mode: 'or',
  },
  risk: {
    climate_max: 100,
    flood_exclude: false,
    wildfire_max: 100,
    heat_max: 100,
  },
  threshold: 0.80,
  name: null,
  delivery: {
    cadence: 'daily',
    max_per_run: 5,
  },
};

/**
 * Converts a value to a number or null.
 * Empty strings become null; other values are converted via Number().
 * @param {string|number|null|undefined} v
 * @returns {number|null}
 */
function toNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!isFinite(n)) return null;
  return n;
}

/**
 * Determines if the form can proceed to the next step.
 * Step 1: requires form.assets.length > 0 AND form.geo.states.length > 0
 * Steps 2-5: always return true
 * Step 6: requires form.name to be non-empty trimmed string
 *
 * @param {number} step
 * @param {Object} form
 * @returns {boolean}
 */
export function canProceedStep(step, form) {
  if (step === 1) {
    return (
      form.assets &&
      form.assets.length > 0 &&
      form.geo &&
      form.geo.states &&
      form.geo.states.length > 0
    );
  }

  if (step >= 2 && step <= 5) {
    return true;
  }

  if (step === 6) {
    return form.name != null && form.name.trim().length > 0;
  }

  return true;
}

/**
 * Converts the form state to an API payload.
 * Maps form field names to backend field names with appropriate transformations:
 * - assets → asset_classes
 * - phys year_min/max → year_built_min/max
 * - fin price_min/max → value_min/max
 * - fin equity_preset → min_equity_pct
 * - owner occupancy "absentee" → absentee_only true
 * - owner hold_min/max → hold_period_min/max
 * - delivery cadence "weekly" → run_schedule.days = ['mon']
 * - delivery cadence "daily"/"realtime" → run_schedule.days = all 7 days
 *
 * @param {Object} form - the complete form state
 * @returns {Object}
 */
export function buildPayload(form) {
  // Determine run_schedule.days based on delivery cadence
  let days;
  if (form.delivery.cadence === 'weekly') {
    days = ['mon'];
  } else {
    // daily, realtime, or other → all 7 days
    days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  }

  const payload = {
    // Name
    label: form.name,

    // Asset classes
    asset_classes: form.assets && form.assets.length > 0 ? form.assets : null,
    asset_class: null,

    // Geography
    geo_states: form.geo.states && form.geo.states.length > 0 ? form.geo.states : null,
    geo_counties:
      form.geo.counties && form.geo.counties.length > 0 ? form.geo.counties : null,
    geo_zips: form.geo.zips && form.geo.zips.length > 0 ? form.geo.zips : null,

    // Physical
    sf_min: toNum(form.phys.sf_min),
    sf_max: toNum(form.phys.sf_max),
    acres_min: toNum(form.phys.acres_min),
    acres_max: toNum(form.phys.acres_max),
    year_built_min: toNum(form.phys.year_min),
    year_built_max: toNum(form.phys.year_max),
    stories_min: toNum(form.phys.stories_min),
    stories_max: toNum(form.phys.stories_max),
    units_min: toNum(form.phys.units_min),
    units_max: toNum(form.phys.units_max),
    zoning_codes:
      form.phys.zoning_codes && form.phys.zoning_codes.length > 0
        ? form.phys.zoning_codes
        : null,

    // Financial
    value_min: toNum(form.fin.price_min),
    value_max: toNum(form.fin.price_max),
    min_equity_pct: toNum(form.fin.equity_preset),
    assessed_below_market: form.fin.assessed_below_market,

    // Ownership
    owner_types: form.owner.entity && form.owner.entity.length > 0 ? form.owner.entity : null,
    absentee_only: form.owner.occupancy === 'absentee',
    hold_period_min: toNum(form.owner.hold_min),
    hold_period_max: toNum(form.owner.hold_max),
    out_of_state_only: form.owner.out_of_state,

    // Signals
    distress_signals: form.signals && form.signals.length > 0 ? form.signals : null,

    // Logic
    distress_match_mode: form.logic.mode,

    // Risk
    climate_risk_max: form.risk.climate_max,
    flood_exclude: form.risk.flood_exclude,
    wildfire_risk_max: form.risk.wildfire_max,
    heat_risk_max: form.risk.heat_max,

    // Threshold
    match_threshold: form.threshold,

    // Delivery
    run_schedule: {
      days: days,
    },
    delivery_max_per_run: 5,
  };

  return payload;
}

/**
 * Converts an API buyBox object back to form state.
 * Reverse mapping with null-safe defaults.
 * Detects cadence from run_schedule.days length:
 * - 1 day → "weekly"
 * - other lengths → "daily"
 *
 * @param {Object} buyBox - the API buy box object
 * @returns {Object} - form state matching EMPTY_FORM structure
 */
export function toFormState(buyBox) {
  // Detect cadence from days array
  let cadence = 'daily';
  if (
    buyBox.run_schedule &&
    buyBox.run_schedule.days &&
    buyBox.run_schedule.days.length === 1
  ) {
    cadence = 'weekly';
  }

  return {
    assets: buyBox.asset_classes ? [...buyBox.asset_classes] : [],
    geo: {
      states: buyBox.geo_states ? [...buyBox.geo_states] : [],
      counties: buyBox.geo_counties ? [...buyBox.geo_counties] : [],
      zips: buyBox.geo_zips ? [...buyBox.geo_zips] : [],
    },
    phys: {
      sf_min: buyBox.sf_min ?? null,
      sf_max: buyBox.sf_max ?? null,
      acres_min: buyBox.acres_min ?? null,
      acres_max: buyBox.acres_max ?? null,
      year_min: buyBox.year_built_min ?? null,
      year_max: buyBox.year_built_max ?? null,
      stories_min: buyBox.stories_min ?? null,
      stories_max: buyBox.stories_max ?? null,
      units_min: buyBox.units_min ?? null,
      units_max: buyBox.units_max ?? null,
      zoning_codes: buyBox.zoning_codes ? [...buyBox.zoning_codes] : [],
    },
    fin: {
      price_min: buyBox.value_min ?? null,
      price_max: buyBox.value_max ?? null,
      equity_preset: buyBox.min_equity_pct ?? null,
      assessed_below_market: buyBox.assessed_below_market ? true : false,
    },
    owner: {
      entity: buyBox.owner_types ? [...buyBox.owner_types] : [],
      occupancy: buyBox.absentee_only ? 'absentee' : 'owner_occupied',
      hold_min: buyBox.hold_period_min ?? null,
      hold_max: buyBox.hold_period_max ?? null,
      out_of_state: buyBox.out_of_state_only ? true : false,
    },
    signals: buyBox.distress_signals ? [...buyBox.distress_signals] : [],
    logic: {
      mode: buyBox.distress_match_mode ?? 'or',
    },
    risk: {
      climate_max: buyBox.climate_risk_max ?? 100,
      flood_exclude: buyBox.flood_exclude ? true : false,
      wildfire_max: buyBox.wildfire_risk_max ?? 100,
      heat_max: buyBox.heat_risk_max ?? 100,
    },
    threshold: buyBox.match_threshold ?? 0.80,
    name: buyBox.label ?? null,
    delivery: {
      cadence: cadence,
      max_per_run: buyBox.delivery_max_per_run ?? 5,
    },
  };
}
