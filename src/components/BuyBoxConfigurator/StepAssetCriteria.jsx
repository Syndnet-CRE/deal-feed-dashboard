import { getCriteriaFields } from '../../lib/taxonomy';

export default function StepAssetCriteria({ form, onChange }) {
  const fields = getCriteriaFields(form.asset_class);

  const handleFieldChange = (key, value) => {
    onChange({
      criteria: {
        ...form.criteria,
        [key]: value,
      },
    });
  };

  const renderInput = (field) => {
    const value = form.criteria?.[field.key] ?? '';

    if (field.type === 'percent') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            className="bb-input"
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            min="0"
            max="100"
            style={{ flex: 1 }}
          />
          <span style={{ color: 'var(--ink-3, #9DA2B3)', fontSize: '14px' }}>%</span>
        </div>
      );
    }

    if (field.type === 'currency') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--ink-3, #9DA2B3)', fontSize: '14px' }}>$</span>
          <input
            className="bb-input"
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            min="0"
            style={{ flex: 1 }}
          />
        </div>
      );
    }

    return (
      <input
        className="bb-input"
        type="number"
        value={value}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Asset Criteria</h1>
      <p className="bb-step-subtitle">Criteria specific to your selected asset class.</p>

      {fields.length === 0 ? (
        <p style={{ color: 'var(--ink-3, #9DA2B3)', fontSize: '14px' }}>
          No additional criteria available for this asset class.
        </p>
      ) : (
        fields.map((field) => (
          <div key={field.key} className="bb-field" style={{ marginBottom: '16px' }}>
            <label className="bb-label">{field.label}</label>
            {renderInput(field)}
          </div>
        ))
      )}
    </div>
  );
}
