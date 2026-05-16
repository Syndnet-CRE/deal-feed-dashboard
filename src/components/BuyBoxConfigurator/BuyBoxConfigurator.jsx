import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import StepAssetClass from './StepAssetClass';
import StepGeography from './StepGeography';
import StepPropertyCriteria from './StepPropertyCriteria';
import StepAssetCriteria from './StepAssetCriteria';
import StepOwnership from './StepOwnership';
import StepDistress from './StepDistress';
import StepRisk from './StepRisk';
import StepDelivery from './StepDelivery';
import StepReview from './StepReview';

const INITIAL_FORM = {
  asset_class: '',
  selected_sub_slugs: [],
  asset_use_codes: [],
  geo_mode: 'state',
  geo_states: [],
  geo_cities: [],
  geo_zips: [],
  geo_counties: [],
  geo_radius_address: '',
  geo_radius_lat: null,
  geo_radius_lng: null,
  geo_radius_miles: null,
  sf_min: '',
  sf_max: '',
  acres_min: '',
  acres_max: '',
  year_built_min: '',
  year_built_max: '',
  stories_min: '',
  units_min: '',
  units_max: '',
  criteria: {},
  owner_types: [],
  absentee_only: false,
  out_of_state_only: false,
  min_hold_yrs: '',
  distress_signals: [],
  distress_match_mode: 'or',
  climate_risk_max: 100,
  flood_exclude: false,
  wildfire_risk_max: 100,
  heat_risk_max: 100,
  match_threshold: 0.80,
  run_schedule: 'weekly',
  delivery_max_per_run: 10,
  label: '',
};

const STEPS = [
  { label: 'Asset Class' },
  { label: 'Geography' },
  { label: 'Property' },
  { label: 'Asset Criteria' },
  { label: 'Ownership' },
  { label: 'Distress' },
  { label: 'Risk' },
  { label: 'Delivery' },
  { label: 'Review' },
];

function canProceed(stepIndex, form) {
  if (stepIndex === 0) return !!form.asset_class;
  if (stepIndex === 1) {
    const hasState = form.geo_states.length > 0;
    const hasCity = form.geo_cities.length > 0;
    const hasZip = form.geo_zips.length > 0;
    const hasCounty = form.geo_counties.length > 0;
    const hasRadius = !!(form.geo_radius_address && form.geo_radius_miles);
    return hasState || hasCity || hasZip || hasCounty || hasRadius;
  }
  if (stepIndex === 8) return form.label.trim().length > 0;
  return true;
}

function buildPayload(form) {
  return {
    label: form.label,
    asset_class: form.asset_class || null,
    asset_use_codes: form.asset_use_codes.length ? form.asset_use_codes : null,
    criteria: Object.keys(form.criteria || {}).length ? form.criteria : null,
    geo_states: form.geo_states.length ? form.geo_states : null,
    geo_counties: form.geo_counties.length ? form.geo_counties : null,
    geo_cities: form.geo_cities.length ? form.geo_cities : null,
    geo_zips: form.geo_zips.length ? form.geo_zips : null,
    geo_radius_address: form.geo_radius_address || null,
    geo_radius_lat: form.geo_radius_lat,
    geo_radius_lng: form.geo_radius_lng,
    geo_radius_miles: form.geo_radius_miles,
    sf_min: form.sf_min !== '' ? Number(form.sf_min) : null,
    sf_max: form.sf_max !== '' ? Number(form.sf_max) : null,
    acres_min: form.acres_min !== '' ? Number(form.acres_min) : null,
    acres_max: form.acres_max !== '' ? Number(form.acres_max) : null,
    year_built_min: form.year_built_min !== '' ? Number(form.year_built_min) : null,
    year_built_max: form.year_built_max !== '' ? Number(form.year_built_max) : null,
    stories_min: form.stories_min !== '' ? Number(form.stories_min) : null,
    units_min: form.units_min !== '' ? Number(form.units_min) : null,
    units_max: form.units_max !== '' ? Number(form.units_max) : null,
    owner_types: form.owner_types.length ? form.owner_types : null,
    absentee_only: form.absentee_only || false,
    out_of_state_only: form.out_of_state_only || false,
    min_hold_yrs: form.min_hold_yrs !== '' ? Number(form.min_hold_yrs) : null,
    distress_signals: form.distress_signals.length ? form.distress_signals : null,
    distress_match_mode: form.distress_match_mode || 'or',
    distress_only: form.distress_signals.length > 0,
    climate_risk_max: form.climate_risk_max,
    flood_exclude: form.flood_exclude || false,
    wildfire_risk_max: form.wildfire_risk_max,
    heat_risk_max: form.heat_risk_max,
    match_threshold: form.match_threshold,
    run_schedule: form.run_schedule,
    delivery_max_per_run: form.delivery_max_per_run,
  };
}

export default function BuyBoxConfigurator({ form: formProp, onChange, mode, boxId, onMatchCount }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, ...formProp }));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const filterKey = JSON.stringify({
    asset_class: form.asset_class,
    asset_use_codes: form.asset_use_codes,
    geo_states: form.geo_states,
    geo_cities: form.geo_cities,
    geo_zips: form.geo_zips,
    geo_counties: form.geo_counties,
    geo_radius_address: form.geo_radius_address,
    geo_radius_miles: form.geo_radius_miles,
    sf_min: form.sf_min,
    sf_max: form.sf_max,
    year_built_min: form.year_built_min,
    year_built_max: form.year_built_max,
  });

  useEffect(() => {
    if (!form.asset_class) return;
    const t = setTimeout(async () => {
      try {
        const data = await api.post('/api/dealfeed/buy-boxes/preview', buildPayload(form));
        if (typeof data.estimated_count === 'number') {
          onMatchCount(data.estimated_count);
        }
      } catch {
        // non-fatal
      }
    }, 400);
    return () => clearTimeout(t);
  }, [filterKey, form.asset_class, onMatchCount]);

  useEffect(() => {
    onChange(form);
  }, [form, onChange]);

  const handleChange = useCallback((patch) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = buildPayload(form);
      if (mode === 'edit' && boxId) {
        await api.patch(`/api/dealfeed/buy-boxes/${boxId}`, payload);
      } else {
        await api.post('/api/dealfeed/buy-boxes', payload);
      }
      navigate('/buy-boxes');
    } catch (err) {
      addToast(err.message || 'Failed to save buy box. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepComponents = [
    StepAssetClass, StepGeography, StepPropertyCriteria, StepAssetCriteria,
    StepOwnership, StepDistress, StepRisk, StepDelivery, StepReview,
  ];
  const ActiveStep = stepComponents[step];

  return (
    <div className="bb-configurator">
      <div className="bb-progress">
        {STEPS.map((s, i) => (
          <div key={i}>
            {i > 0 && <div className={`bb-progress-line${i <= step ? ' done' : ''}`} />}
            <div
              className={`bb-progress-step${i === step ? ' active' : i < step ? ' done' : ' pending'}`}
              onClick={() => i < step && setStep(i)}
              style={{ cursor: i < step ? 'pointer' : 'default' }}
            >
              {i < step ? '✓' : i + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="bb-step">
        <ActiveStep
          form={form}
          onChange={handleChange}
          onSubmit={step === 8 ? handleSubmit : undefined}
          submitting={step === 8 ? submitting : undefined}
        />
      </div>

      <div className="bb-nav">
        {step > 0 ? (
          <button className="bb-btn-back" onClick={() => setStep(s => s - 1)}>Back</button>
        ) : <div />}

        {step < 8 ? (
          <button
            className="bb-btn-next"
            disabled={!canProceed(step, form)}
            onClick={() => setStep(s => s + 1)}
          >
            {step === 7 ? 'Review' : 'Next'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
