import { useState } from 'react';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'Washington D.C.' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export default function StepGeography({ form, onChange }) {
  const [geoMode, setGeoMode] = useState(form.geo_mode || 'state');
  const [cityInput, setCityInput] = useState('');
  const [zipInput, setZipInput] = useState('');

  const handleStateToggle = (code) => {
    const current = form.geo_states || [];
    const next = current.includes(code)
      ? current.filter(s => s !== code)
      : [...current, code];
    onChange({ geo_states: next });
  };

  const handleCityAdd = (e) => {
    if (e.key === 'Enter' && cityInput.trim()) {
      e.preventDefault();
      const current = form.geo_cities || [];
      if (!current.includes(cityInput.trim())) {
        onChange({ geo_cities: [...current, cityInput.trim()] });
      }
      setCityInput('');
    }
  };

  const handleCityRemove = (city) => {
    onChange({ geo_cities: (form.geo_cities || []).filter(c => c !== city) });
  };

  const handleZipAdd = (e) => {
    if (e.key === 'Enter' && zipInput.trim()) {
      e.preventDefault();
      const trimmed = zipInput.trim();
      if (/^\d{5}$/.test(trimmed)) {
        const current = form.geo_zips || [];
        if (!current.includes(trimmed)) {
          onChange({ geo_zips: [...current, trimmed] });
        }
        setZipInput('');
      }
    }
  };

  const handleZipRemove = (zip) => {
    onChange({ geo_zips: (form.geo_zips || []).filter(z => z !== zip) });
  };

  const handleAddressChange = (e) => {
    onChange({ geo_radius_address: e.target.value });
  };

  const handleMilesChange = (e) => {
    onChange({ geo_radius_miles: e.target.value ? Number(e.target.value) : null });
  };

  const handleModeChange = (mode) => {
    setGeoMode(mode);
    onChange({ geo_mode: mode });
  };

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Geography</h1>
      <p className="bb-step-subtitle">Define the areas you want to target. You can set multiple modes.</p>

      <div className="bb-tab-row">
        <button
          className={`bb-tab ${geoMode === 'state' ? 'active' : ''}`}
          onClick={() => handleModeChange('state')}
        >
          State
        </button>
        <button
          className={`bb-tab ${geoMode === 'metro' ? 'active' : ''}`}
          onClick={() => handleModeChange('metro')}
        >
          Metro
        </button>
        <button
          className={`bb-tab ${geoMode === 'zip' ? 'active' : ''}`}
          onClick={() => handleModeChange('zip')}
        >
          ZIP
        </button>
        <button
          className={`bb-tab ${geoMode === 'radius' ? 'active' : ''}`}
          onClick={() => handleModeChange('radius')}
        >
          Radius
        </button>
      </div>

      {geoMode === 'state' && (
        <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '24px' }}>
          {US_STATES.map((state) => (
            <div key={state.code} className="bb-toggle-row">
              <label className="bb-toggle-label">
                <input
                  type="checkbox"
                  checked={(form.geo_states || []).includes(state.code)}
                  onChange={() => handleStateToggle(state.code)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                {state.name}
              </label>
            </div>
          ))}
        </div>
      )}

      {geoMode === 'metro' && (
        <>
          <div className="bb-field" style={{ marginBottom: '16px' }}>
            <label className="bb-label">Add City</label>
            <input
              className="bb-input"
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleCityAdd}
              placeholder="Type city name and press Enter"
            />
          </div>
          <div className="bb-tag-list">
            {(form.geo_cities || []).map((city) => (
              <div key={city} className="bb-tag">
                {city}
                <button
                  className="bb-tag-remove"
                  onClick={() => handleCityRemove(city)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {geoMode === 'zip' && (
        <>
          <div className="bb-field" style={{ marginBottom: '16px' }}>
            <label className="bb-label">Add ZIP Code</label>
            <input
              className="bb-input"
              type="text"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              onKeyDown={handleZipAdd}
              placeholder="5-digit ZIP and press Enter"
              maxLength="5"
            />
          </div>
          <div className="bb-tag-list">
            {(form.geo_zips || []).map((zip) => (
              <div key={zip} className="bb-tag">
                {zip}
                <button
                  className="bb-tag-remove"
                  onClick={() => handleZipRemove(zip)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {geoMode === 'radius' && (
        <>
          <div className="bb-field-row">
            <div className="bb-field">
              <label className="bb-label">Address</label>
              <input
                className="bb-input"
                type="text"
                value={form.geo_radius_address || ''}
                onChange={handleAddressChange}
                placeholder="e.g., Austin, TX"
              />
            </div>
            <div className="bb-field">
              <label className="bb-label">Radius (miles)</label>
              <input
                className="bb-input"
                type="number"
                value={form.geo_radius_miles ?? ''}
                onChange={handleMilesChange}
                placeholder="e.g., 25"
                min="1"
              />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-3, #9DA2B3)', marginTop: '8px' }}>
            Lat/lng will be geocoded automatically
          </p>
        </>
      )}
    </div>
  );
}
