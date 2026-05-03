const PALETTE = {
  multifamily:   '#E91E63',
  office:        '#00BCD4',
  retail:        '#F44336',
  industrial:    '#607D8B',
  land:          '#4CAF50',
  hospitality:   '#9C27B0',
  healthcare:    '#009688',
  special:       '#9E9E9E',
  self_storage:  '#FF9800',
};

export const LEGEND_ITEMS = [
  { label: 'Multifamily',     color: PALETTE.multifamily },
  { label: 'Self-Storage',    color: PALETTE.self_storage },
  { label: 'Industrial',      color: PALETTE.industrial },
  { label: 'Retail',          color: PALETTE.retail },
  { label: 'Office',          color: PALETTE.office },
  { label: 'Land',            color: PALETTE.land },
  { label: 'Hospitality',     color: PALETTE.hospitality },
  { label: 'Healthcare',      color: PALETTE.healthcare },
  { label: 'Special Purpose', color: PALETTE.special },
];

function classify(assetClass) {
  if (!assetClass) return 'special';
  const s = assetClass.toLowerCase();
  if (s.includes('self') || s.includes('storage'))           return 'self_storage';
  if (s.includes('multi') || s.includes('apartment') ||
      s.includes('duplex') || s.includes('garden') ||
      s.includes('mid-rise') || s.includes('high-rise'))     return 'multifamily';
  if (s.includes('office') || s.includes('flex') ||
      s.includes('life science') || s.includes('co-work'))   return 'office';
  if (s.includes('retail') || s.includes('strip') ||
      s.includes('mall') || s.includes('restaurant') ||
      s.includes('car wash') || s.includes('grocery'))       return 'retail';
  if (s.includes('industri') || s.includes('warehouse') ||
      s.includes('distribution') || s.includes('manufactur') ||
      s.includes('cold stor') || s.includes('data center'))  return 'industrial';
  if (s.includes('land') || s.includes('ranch') ||
      s.includes('farm') || s.includes('agricult') ||
      s.includes('acreage') || s.includes('infill') ||
      s.includes('pad site') || s.includes('brownfield'))    return 'land';
  if (s.includes('hotel') || s.includes('motel') ||
      s.includes('hospit') || s.includes('resort') ||
      s.includes('inn') || s.includes('b&b'))                return 'hospitality';
  if (s.includes('health') || s.includes('medical') ||
      s.includes('clinic') || s.includes('hospital') ||
      s.includes('nursing') || s.includes('assisted'))       return 'healthcare';
  return 'special';
}

export function getPinColor(assetClass) {
  return PALETTE[classify(assetClass)] ?? PALETTE.special;
}
