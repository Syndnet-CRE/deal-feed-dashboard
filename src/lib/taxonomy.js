export const ASSET_CLASSES = [
  {
    slug: 'self_storage',
    label: 'Self Storage',
    sub_classes: [
      { slug: 'drive_up',          label: 'Drive-Up',          use_codes: [229] },
      { slug: 'climate_controlled', label: 'Climate Controlled', use_codes: [229] },
      { slug: 'boat_rv_storage',   label: 'Boat / RV Storage', use_codes: [229] },
    ],
    criteria_fields: [
      { key: 'unit_count_min',      label: 'Min Units',         type: 'number',   placeholder: '50' },
      { key: 'occupancy_rate_min',  label: 'Min Occupancy %',   type: 'percent',  placeholder: '80' },
      { key: 'price_per_unit_max',  label: 'Max $/Unit',        type: 'currency', placeholder: '15000' },
    ],
  },
  {
    slug: 'multifamily',
    label: 'Multifamily',
    sub_classes: [
      { slug: 'apartment_5plus', label: 'Apartment (5+ Units)', use_codes: [369, 373, 375, 378] },
    ],
    criteria_fields: [
      { key: 'unit_count_min', label: 'Min Units', type: 'number', placeholder: '5' },
      { key: 'unit_count_max', label: 'Max Units', type: 'number', placeholder: '200' },
    ],
  },
  {
    slug: 'rv_park',
    label: 'RV / Mobile Home Parks',
    sub_classes: [
      { slug: 'rv_park',          label: 'RV Park',          use_codes: [155] },
      { slug: 'mobile_home_park', label: 'Mobile Home Park', use_codes: [339] },
    ],
    criteria_fields: [
      { key: 'pad_count_min', label: 'Min Pads', type: 'number', placeholder: '20' },
    ],
  },
  {
    slug: 'land',
    label: 'Land',
    sub_classes: [
      { slug: 'urban_infill',       label: 'Urban Infill',        use_codes: [120, 105] },
      { slug: 'suburban_fringe',    label: 'Suburban / Fringe',   use_codes: [117, 109] },
      { slug: 'agricultural_rural', label: 'Agricultural / Rural', use_codes: [392, 118] },
    ],
    criteria_fields: [],
  },
  {
    slug: 'retail',
    label: 'Retail',
    sub_classes: [
      { slug: 'strip_mall',   label: 'Strip Mall / Shopping Center', use_codes: [135, 393] },
      { slug: 'freestanding', label: 'Freestanding Retail',          use_codes: [126, 148] },
      { slug: 'restaurant',   label: 'Restaurant / Food Service',    use_codes: [161, 169] },
      { slug: 'other_retail', label: 'Other Retail',                 use_codes: [361, 171] },
    ],
    criteria_fields: [],
  },
  {
    slug: 'gas_station',
    label: 'Gas Stations / C-Stores',
    sub_classes: [
      { slug: 'gas_station',       label: 'Gas Station / Service Station', use_codes: [167] },
      { slug: 'convenience_store', label: 'Convenience Store',             use_codes: [124] },
    ],
    criteria_fields: [],
  },
  {
    slug: 'residential_sfr',
    label: 'Residential SFR / 1-4 Unit',
    sub_classes: [
      { slug: 'sfr',        label: 'Single Family',     use_codes: [100] },
      { slug: 'condo',      label: 'Condominium',       use_codes: [102] },
      { slug: 'duplex',     label: 'Duplex (2 Units)',  use_codes: [366] },
      { slug: 'triplex',    label: 'Triplex (3 Units)', use_codes: [383] },
      { slug: 'quadruplex', label: 'Quadruplex (4 Units)', use_codes: [386] },
    ],
    criteria_fields: [],
  },
  {
    slug: 'industrial',
    label: 'Warehouse / Industrial',
    sub_classes: [
      { slug: 'warehouse',       label: 'Warehouse / Distribution', use_codes: [220] },
      { slug: 'flex',            label: 'Flex Industrial',          use_codes: [222] },
      { slug: 'light_industrial', label: 'Light Industrial',        use_codes: [210] },
      { slug: 'heavy_industrial', label: 'Heavy Industrial',        use_codes: [212] },
      { slug: 'manufacturing',   label: 'Manufacturing',            use_codes: [231] },
      { slug: 'rnd',             label: 'R&D / Office-Warehouse',   use_codes: [238] },
    ],
    criteria_fields: [
      { key: 'ceiling_height_min_ft', label: 'Min Ceiling Height (ft)', type: 'number', placeholder: '24' },
      { key: 'loading_docks_min',     label: 'Min Loading Docks',       type: 'number', placeholder: '2' },
    ],
  },
];

const ASSET_CLASS_MAP = Object.fromEntries(ASSET_CLASSES.map(c => [c.slug, c]));

export function getClassBySlug(slug) {
  return ASSET_CLASS_MAP[slug] || null;
}

export function getSubClasses(slug) {
  return ASSET_CLASS_MAP[slug]?.sub_classes || [];
}

export function getCriteriaFields(slug) {
  return ASSET_CLASS_MAP[slug]?.criteria_fields || [];
}

export function getUseCodesForSubClasses(selectedSubSlugs, assetClassSlug) {
  const cls = ASSET_CLASS_MAP[assetClassSlug];
  if (!cls) return [];
  const source = (!selectedSubSlugs || selectedSubSlugs.length === 0)
    ? cls.sub_classes
    : cls.sub_classes.filter(sc => selectedSubSlugs.includes(sc.slug));
  return [...new Set(source.flatMap(sc => sc.use_codes))];
}
