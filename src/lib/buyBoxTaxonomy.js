export const ASSET_CLASSES = [
  {
    id: 'multifamily',
    label: 'Multifamily',
    description: 'Residential income properties: duplexes, apartments, and residential income buildings',
    subtypes: [
      { label: 'Duplex (2 Units)',          code: 366 },
      { label: 'Triplex (3 Units)',          code: 383 },
      { label: 'Quadruplex (4 Units)',       code: 386 },
      { label: 'Apartment / Multifamily 5+', code: 369 },
      { label: 'Mobile / Manufactured Home', code: 373 },
      { label: 'Loft / Live-Work',           code: 378 },
      { label: 'Residential Income (NEC)',   code: 375 },
    ],
  },
  {
    id: 'industrial',
    label: 'Industrial',
    description: 'Warehouse, manufacturing, flex, and storage facilities',
    subtypes: [
      { label: 'Light Industrial',               code: 212 },
      { label: 'Warehouse / Distribution',       code: 238 },
      { label: 'Heavy Industrial / Manufacturing', code: 220 },
      { label: 'Flex Industrial',                code: 222 },
      { label: 'Self Storage / Mini-Warehouse',  code: 229 },
      { label: 'Truck Terminal / Freight',       code: 231 },
      { label: 'Processing / Packaging',         code: 210 },
      { label: 'Industrial (General)',           code: 395 },
    ],
  },
  {
    id: 'retail',
    label: 'Retail',
    description: 'Storefronts, shopping centers, restaurants, and service retail',
    subtypes: [
      { label: 'Retail (General)',               code: 135 },
      { label: 'Strip Mall / Shopping Center',   code: 393 },
      { label: 'Neighborhood Shopping Center',   code: 126 },
      { label: 'Community / Neighborhood Retail', code: 361 },
      { label: 'Supermarket / Grocery',          code: 148 },
      { label: 'Convenience Store',              code: 124 },
      { label: 'Restaurant / Food Service',      code: 169 },
      { label: 'Auto Dealership',                code: 171 },
      { label: 'Retail (Specialty)',             code: 161 },
    ],
  },
  {
    id: 'office',
    label: 'Office',
    description: 'Professional, medical, and general office buildings',
    subtypes: [
      { label: 'Office Building (General)',        code: 178 },
      { label: 'Professional Office',             code: 160 },
      { label: 'Medical Office',                  code: 139 },
      { label: 'Mixed Residential / Commercial',  code: 181 },
      { label: 'Commercial (NEC / Misc)',          code: 359 },
    ],
  },
  {
    id: 'land',
    label: 'Land',
    description: 'Vacant, agricultural, ranch, and undeveloped parcels',
    subtypes: [
      { label: 'Vacant Land (General)',    code: 389 },
      { label: 'Vacant Land (Agricultural)', code: 120 },
      { label: 'Agricultural (General)',   code: 392 },
      { label: 'Ranch / Range Land',       code: 117 },
      { label: 'Cropland / Row Crops',     code: 105 },
      { label: 'Pastureland / Grazing',    code: 109 },
      { label: 'Timberland / Forestry',    code: 118 },
    ],
  },
  {
    id: 'sfr',
    label: 'Single Family',
    description: 'Single family homes, condos, co-ops, and owner-occupied residential',
    subtypes: [
      { label: 'Single Family Residence',  code: 100 },
      { label: 'Condominium',              code: 102 },
      { label: 'Cooperative (Co-op)',      code: 104 },
      { label: 'Mobile / Manufactured Home (SFR)', code: 373 },
    ],
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    description: 'Hotels, motels, resorts, extended stay, and bed & breakfast',
    subtypes: [
      { label: 'Hotel',                    code: 260 },
      { label: 'Motel',                    code: 265 },
      { label: 'Extended Stay / Suite Hotel', code: 270 },
      { label: 'Resort',                   code: 275 },
      { label: 'Bed & Breakfast / Inn',    code: 293 },
    ],
  },
  {
    id: 'special_purpose',
    label: 'Special Purpose',
    description: 'Gas stations, parking, healthcare, and other specialty property types',
    subtypes: [
      { label: 'Service Station / Gas Station', code: 167 },
      { label: 'Parking Lot / Garage',          code: 339 },
      { label: 'Healthcare / Medical Clinic',   code: 296 },
      { label: 'Rehabilitation / Skilled Nursing', code: 155 },
      { label: 'Townhouse',                     code: 360 },
      { label: 'Planned Unit Development',      code: 380 },
    ],
  },
];

export const SCHEDULE_DAYS = [
  { abbr: 'mon', label: 'Mon' },
  { abbr: 'tue', label: 'Tue' },
  { abbr: 'wed', label: 'Wed' },
  { abbr: 'thu', label: 'Thu' },
  { abbr: 'fri', label: 'Fri' },
  { abbr: 'sat', label: 'Sat' },
  { abbr: 'sun', label: 'Sun' },
];

export const ALL_DAYS = SCHEDULE_DAYS.map(d => d.abbr);

export const DISTRESS_SIGNAL_OPTIONS = [
  { value: 'active-foreclosure',       label: 'Active foreclosure record' },
  { value: 'tax-delinquent',           label: 'Tax delinquent' },
  { value: 'absentee-owner',           label: 'Absentee owner' },
  { value: 'long-term-hold',           label: 'Long-term hold' },
  { value: 'quit-claim-deed',          label: 'Quit claim deed in history' },
  { value: 'non-arms-length',          label: 'Non-arms-length prior sale' },
  { value: 'investor-buyer',           label: 'Investor buyer at last purchase' },
  { value: 'arm-mortgage',             label: 'ARM mortgage' },
  { value: 'high-ltv',                 label: 'High LTV (>80%)' },
  { value: 'free-and-clear',           label: 'Free and clear (no mortgage)' },
];

export const OWNER_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'llc',        label: 'LLC / Entity' },
  { value: 'trust',      label: 'Trust' },
  { value: 'corporate',  label: 'Corporate' },
];

export const GEO_TYPES = [
  { id: 'state',  label: 'State' },
  { id: 'metro',  label: 'Metro / CBSA' },
  { id: 'zip',    label: 'Zip Code List' },
  { id: 'radius', label: 'Radius Around Address' },
];

export const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
  ['DC','District of Columbia'],
];

export const MAJOR_METROS = [
  'Atlanta, GA','Austin, TX','Baltimore, MD','Boston, MA','Charlotte, NC',
  'Chicago, IL','Cincinnati, OH','Cleveland, OH','Columbus, OH','Dallas, TX',
  'Denver, CO','Detroit, MI','Fort Worth, TX','Houston, TX','Indianapolis, IN',
  'Jacksonville, FL','Kansas City, MO','Las Vegas, NV','Los Angeles, CA','Louisville, KY',
  'Memphis, TN','Miami, FL','Milwaukee, WI','Minneapolis, MN','Nashville, TN',
  'New Orleans, LA','New York, NY','Oklahoma City, OK','Orlando, FL','Philadelphia, PA',
  'Phoenix, AZ','Pittsburgh, PA','Portland, OR','Raleigh, NC','Richmond, VA',
  'Riverside, CA','Sacramento, CA','Salt Lake City, UT','San Antonio, TX','San Diego, CA',
  'San Francisco, CA','San Jose, CA','Seattle, WA','St. Louis, MO','Tampa, FL',
  'Virginia Beach, VA','Washington, DC',
];

export function getAssetClass(id) {
  return ASSET_CLASSES.find(c => c.id === id) || null;
}

export function formatUseCodes(asset_class, asset_use_codes) {
  if (!asset_class || !asset_use_codes?.length) return '';
  const cls = getAssetClass(asset_class);
  if (!cls) return asset_class;
  const labels = asset_use_codes
    .map(code => cls.subtypes.find(s => s.code === code)?.label)
    .filter(Boolean);
  return labels.join(', ') || asset_class;
}

export function formatSchedule(run_schedule) {
  if (!run_schedule?.days?.length) return 'Runs daily';
  if (run_schedule.days.length === 7) return 'Runs daily';
  const labels = SCHEDULE_DAYS
    .filter(d => run_schedule.days.includes(d.abbr))
    .map(d => d.label);
  return `Runs ${labels.join(' / ')}`;
}

export function formatGeo(box) {
  if (box.geo_states?.length) return box.geo_states.join(', ');
  if (box.geo_cities?.length) {
    const n = box.geo_cities.length;
    return n === 1 ? `${box.geo_cities[0]} metro` : `${n} metros`;
  }
  if (box.geo_zips?.length) {
    const n = box.geo_zips.length;
    return n === 1 ? `ZIP ${box.geo_zips[0]}` : `${n} zip codes`;
  }
  if (box.geo_radius_miles && box.geo_radius_address) {
    return `${box.geo_radius_miles}mi radius — ${box.geo_radius_address}`;
  }
  return 'No geography set';
}
