/**
 * Converts a value to a number or null.
 * Empty strings become null; other values are converted via Number().
 * @param {string|number|null|undefined} v
 * @returns {number|null}
 */
export function toNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!isFinite(n)) return null;
  return n;
}

/**
 * Checks if the active geo mode has data filled in.
 * @param {Object} form - form state
 * @returns {boolean}
 */
export function activeGeoHasData(form) {
  const { geoMode, geo_states, geo_cities, geo_zips, geo_radius_address } = form;

  if (geoMode === 'state') return geo_states.length > 0;
  if (geoMode === 'metro') return geo_cities.length > 0;
  if (geoMode === 'zip') return geo_zips.length > 0;
  if (geoMode === 'radius') {
    return geo_radius_address.trim().length > 0 && toNum(form.geo_radius_miles) > 0;
  }
  return false;
}

/**
 * 9-step gate for the BuyBoxWizard.
 * Steps: 1=Name, 2=Geo, 3=AssetClass, 4=SubAsset, 5=Criteria,
 *        6=Ownership, 7=Distress, 8=Schedule, 9=Review
 * @param {number} step
 * @param {Object} form
 * @returns {boolean}
 */
export function canProceedStep(step, form) {
  if (step === 1) return form.label.trim().length > 0;
  if (step === 2) return activeGeoHasData(form);
  if (step === 3) return !!form.asset_class;
  if (step === 4) return Array.isArray(form.asset_use_codes) && form.asset_use_codes.length > 0;
  if (step === 5) return true;
  if (step === 6) return true;
  if (step === 7) return true;
  if (step === 8) {
    const days = form.run_schedule?.days;
    return Array.isArray(days) && days.length > 0;
  }
  return true;
}

// Backward-compat alias — ConfigurationOverlay uses canProceed(step, form)
export const canProceed = canProceedStep;

/**
 * Converts the wizard form state to an API payload.
 * Includes only geo fields for the active geoMode.
 * Empty arrays become null; empty strings in notes become null.
 * @param {Object} form - the complete form state
 * @returns {Object}
 */
export function buildPayload(form) {
  const geo = {};

  if (form.geoMode === 'state') {
    geo.geo_states = form.geo_states;
  } else if (form.geoMode === 'metro') {
    geo.geo_cities = form.geo_cities;
  } else if (form.geoMode === 'zip') {
    geo.geo_zips = form.geo_zips;
  } else if (form.geoMode === 'radius') {
    geo.geo_radius_address = form.geo_radius_address || null;
    geo.geo_radius_miles = toNum(form.geo_radius_miles);
    if (form.geo_radius_lat != null) geo.geo_radius_lat = form.geo_radius_lat;
    if (form.geo_radius_lng != null) geo.geo_radius_lng = form.geo_radius_lng;
  }

  return {
    label: form.label.trim(),
    notes: form.notes?.trim() || null,
    asset_class: form.asset_class || null,
    asset_use_codes: form.asset_use_codes?.length ? form.asset_use_codes : [],
    asset_classes: form.asset_classes?.length ? form.asset_classes : null,
    run_schedule: form.run_schedule || { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    ...geo,
    sf_min: toNum(form.sf_min),
    sf_max: toNum(form.sf_max),
    acres_min: toNum(form.acres_min),
    acres_max: toNum(form.acres_max),
    value_min: toNum(form.value_min),
    value_max: toNum(form.value_max),
    year_built_min: toNum(form.year_built_min),
    year_built_max: toNum(form.year_built_max),
    min_hold_yrs: toNum(form.min_hold_yrs),
    zoning_codes: form.zoning_codes?.length ? form.zoning_codes : null,
    owner_types: form.owner_types?.length ? form.owner_types : null,
    absentee_only: form.absentee_only || false,
    out_of_state_only: form.out_of_state_only || false,
    distress_signals: form.distress_signals?.length ? form.distress_signals : null,
    distress_only: form.distress_only || false,
  };
}
