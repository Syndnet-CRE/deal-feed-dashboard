import { ASSET_CLASSES, getSubClasses, getUseCodesForSubClasses } from '../../lib/taxonomy';

const ASSET_CLASS_EMOJIS = {
  self_storage: '🏪',
  multifamily: '🏢',
  rv_park: '🚐',
  land: '🌾',
  retail: '🛍️',
  gas_station: '⛽',
  residential_sfr: '🏠',
  industrial: '🏭',
};

export default function StepAssetClass({ form, onChange }) {
  const handleClassSelect = (slug) => {
    onChange({
      asset_class: slug,
      selected_sub_slugs: [],
      asset_use_codes: getUseCodesForSubClasses([], slug),
      criteria: {},
    });
  };

  const handleSubToggle = (subSlug) => {
    const current = form.selected_sub_slugs || [];
    const next = current.includes(subSlug)
      ? current.filter(s => s !== subSlug)
      : [...current, subSlug];
    onChange({
      selected_sub_slugs: next,
      asset_use_codes: getUseCodesForSubClasses(next, form.asset_class),
    });
  };

  const handleAnyClick = () => {
    onChange({
      selected_sub_slugs: [],
      asset_use_codes: getUseCodesForSubClasses([], form.asset_class),
    });
  };

  const subClasses = form.asset_class ? getSubClasses(form.asset_class) : [];

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Asset Class</h1>
      <p className="bb-step-subtitle">Select the property type you want to target.</p>

      <div className="bb-class-grid">
        {ASSET_CLASSES.map((cls) => (
          <div
            key={cls.slug}
            className={`bb-class-card ${form.asset_class === cls.slug ? 'selected' : ''}`}
            onClick={() => handleClassSelect(cls.slug)}
          >
            <div style={{ fontSize: '28px' }}>{ASSET_CLASS_EMOJIS[cls.slug]}</div>
            <div className="bb-class-card-label">{cls.label}</div>
          </div>
        ))}
      </div>

      {form.asset_class && subClasses.length > 0 && (
        <>
          <h2 className="bb-section-head">Refine by sub-type</h2>
          <div className="bb-subclass-grid">
            <button
              className={`bb-subclass-chip ${(form.selected_sub_slugs || []).length === 0 ? 'selected' : ''}`}
              onClick={handleAnyClick}
            >
              Any
            </button>
            {subClasses.map((sub) => (
              <button
                key={sub.slug}
                className={`bb-subclass-chip ${(form.selected_sub_slugs || []).includes(sub.slug) ? 'selected' : ''}`}
                onClick={() => handleSubToggle(sub.slug)}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
