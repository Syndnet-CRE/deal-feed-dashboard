export default function StepPropertyCriteria({ form, onChange }) {
  const handleFieldChange = (field, value) => {
    onChange({ [field]: value });
  };

  const unitClasses = ['multifamily', 'residential_sfr', 'self_storage', 'rv_park'];
  const showUnits = unitClasses.includes(form.asset_class);

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Property Criteria</h1>
      <p className="bb-step-subtitle">Narrow by physical attributes. All fields optional.</p>

      <div className="bb-field-row">
        <div className="bb-field">
          <label className="bb-label">Min SF</label>
          <input
            className="bb-input"
            type="number"
            value={form.sf_min || ''}
            onChange={(e) => handleFieldChange('sf_min', e.target.value)}
            placeholder="5,000"
          />
        </div>
        <div className="bb-field">
          <label className="bb-label">Max SF</label>
          <input
            className="bb-input"
            type="number"
            value={form.sf_max || ''}
            onChange={(e) => handleFieldChange('sf_max', e.target.value)}
            placeholder="50,000"
          />
        </div>
      </div>

      <div className="bb-field-row">
        <div className="bb-field">
          <label className="bb-label">Min Acres</label>
          <input
            className="bb-input"
            type="number"
            value={form.acres_min || ''}
            onChange={(e) => handleFieldChange('acres_min', e.target.value)}
            placeholder="0.5"
            step="0.1"
          />
        </div>
        <div className="bb-field">
          <label className="bb-label">Max Acres</label>
          <input
            className="bb-input"
            type="number"
            value={form.acres_max || ''}
            onChange={(e) => handleFieldChange('acres_max', e.target.value)}
            placeholder="100"
            step="0.1"
          />
        </div>
      </div>

      <div className="bb-field-row">
        <div className="bb-field">
          <label className="bb-label">Min Year Built</label>
          <input
            className="bb-input"
            type="number"
            value={form.year_built_min || ''}
            onChange={(e) => handleFieldChange('year_built_min', e.target.value)}
            placeholder="1990"
            min="1800"
            max={new Date().getFullYear()}
          />
        </div>
        <div className="bb-field">
          <label className="bb-label">Max Year Built</label>
          <input
            className="bb-input"
            type="number"
            value={form.year_built_max || ''}
            onChange={(e) => handleFieldChange('year_built_max', e.target.value)}
            placeholder="2024"
            min="1800"
            max={new Date().getFullYear()}
          />
        </div>
      </div>

      <div className="bb-field-row">
        <div className="bb-field">
          <label className="bb-label">Min Stories</label>
          <input
            className="bb-input"
            type="number"
            value={form.stories_min || ''}
            onChange={(e) => handleFieldChange('stories_min', e.target.value)}
            placeholder="1"
            min="1"
          />
        </div>
      </div>

      {showUnits && (
        <div className="bb-field-row">
          <div className="bb-field">
            <label className="bb-label">Min Units</label>
            <input
              className="bb-input"
              type="number"
              value={form.units_min || ''}
              onChange={(e) => handleFieldChange('units_min', e.target.value)}
              placeholder="5"
              min="1"
            />
          </div>
          <div className="bb-field">
            <label className="bb-label">Max Units</label>
            <input
              className="bb-input"
              type="number"
              value={form.units_max || ''}
              onChange={(e) => handleFieldChange('units_max', e.target.value)}
              placeholder="500"
              min="1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
