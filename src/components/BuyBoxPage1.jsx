import { useState, useEffect, useRef, Fragment } from 'react'
import {
  Home, Building, Building2, Layers, Coins,
  ShoppingBag, ShoppingCart, Store, Utensils, Car, Wrench, Stethoscope, Tag,
  Briefcase, Factory, Warehouse, Package, Archive, Truck,
  Map, Sprout, Wheat, Fence, TreePine,
  Hotel, BedDouble, BedSingle, Umbrella,
  Fuel, ParkingSquare, Hospital, Heart, MapPin, Landmark, School, Dumbbell, Building as ChurchIcon,
} from 'lucide-react'
import { Ic } from './buybox-icons'
import { ASSET_CLASSES as TAXONOMY_CLASSES, US_STATES, MAJOR_METROS } from '../lib/buyBoxTaxonomy'
import { api } from '../lib/api'

const SUBTYPE_ICONS = {
  100: Home, 102: Building, 104: Building2, 373: Home,
  366: Home, 383: Building, 386: Building2, 369: Building2,
  378: Layers, 375: Coins,
  135: ShoppingBag, 393: Store, 126: Store, 361: Store, 148: ShoppingCart,
  124: ShoppingBag, 169: Utensils, 146: Utensils, 171: Car, 172: Wrench,
  127: Stethoscope, 186: Car, 161: Tag,
  178: Building2, 160: Briefcase, 139: Stethoscope, 193: Building,
  194: Layers, 183: Layers, 181: Home, 359: Building2,
  212: Factory, 238: Warehouse, 220: Wrench, 222: Package, 229: Archive,
  231: Truck, 210: Package, 280: Factory, 395: Building2,
  389: Map, 120: Sprout, 392: Wheat, 117: Fence, 105: Wheat, 109: Sprout, 118: TreePine,
  260: Hotel, 265: BedDouble, 270: BedSingle, 275: Umbrella, 293: Home,
  167: Fuel, 339: ParkingSquare, 296: Hospital, 155: Heart,
  360: Home, 380: MapPin, 150: Landmark, 175: School, 267: Dumbbell, 348: ChurchIcon, 133: ChurchIcon,
}

const ASSET_DISPLAY = {
  sfr:             { icon: 'sfr',         title: 'Single-family',       sub: 'Detached, condo, co-op',         count: 4_280_400 },
  multifamily:     { icon: 'smm',         title: 'Multifamily',         sub: '2+ units, apartments',            count: 1_391_000 },
  retail:          { icon: 'commercial',  title: 'Commercial / Retail',  sub: 'Storefronts, shopping centers',  count: 412_100   },
  office:          { icon: 'lmm',         title: 'Office',              sub: 'Professional, medical',           count: 218_400   },
  industrial:      { icon: 'industrial',  title: 'Industrial',          sub: 'Warehouse, flex, storage',        count: 198_400   },
  land:            { icon: 'land',        title: 'Vacant land',         sub: 'Lots, acreage, agricultural',    count: 1_840_000 },
  hospitality:     { icon: 'hospitality', title: 'Hospitality',         sub: 'Hotels, motels, resorts',        count: 64_800    },
  special_purpose: { icon: 'mixed',       title: 'Special Purpose',     sub: 'Gas station, parking, medical',  count: 48_200    },
}

const DISPLAY_CLASSES = TAXONOMY_CLASSES.map(c => ({
  id: c.id,
  subtypes: c.subtypes,
  ...ASSET_DISPLAY[c.id],
}))

// Tracked distressed property counts by state
const STATE_COUNTS = {
  AL: 98_400,  AK: 22_100,  AZ: 162_300, AR: 62_800,  CA: 612_900,
  CO: 121_400, CT: 74_200,  DE: 24_600,  FL: 488_200, GA: 218_800,
  HI: 42_100,  ID: 48_600,  IL: 188_400, IN: 128_700, IA: 68_200,
  KS: 58_400,  KY: 98_100,  LA: 104_200, ME: 44_800,  MD: 118_600,
  MA: 148_200, MI: 218_400, MN: 128_600, MS: 64_800,  MO: 128_400,
  MT: 28_200,  NE: 48_600,  NV: 82_100,  NH: 48_400,  NJ: 182_600,
  NM: 48_800,  NY: 388_400, NC: 184_500, ND: 18_200,  OH: 196_200,
  OK: 84_600,  OR: 98_400,  PA: 178_900, RI: 28_800,  SC: 102_400,
  SD: 22_800,  TN: 142_700, TX: 612_400, UT: 68_600,  VT: 18_400,
  VA: 162_800, WA: 142_600, WV: 38_400,  WI: 118_200, WY: 12_800,
  DC: 28_400,
}

// Top counties by state (used for backward compat with existing buy boxes)
const STATE_COUNTIES = {
  AL: ['Jefferson','Mobile','Madison','Montgomery','Shelby'],
  AK: ['Anchorage','Fairbanks North Star','Matanuska-Susitna','Kenai Peninsula'],
  AZ: ['Maricopa','Pima','Pinal','Yavapai','Coconino','Yuma'],
  AR: ['Pulaski','Benton','Sebastian','Washington','Craighead'],
  CA: ['Los Angeles','San Diego','Orange','Riverside','San Bernardino','Sacramento','Santa Clara','Alameda'],
  CO: ['Denver','El Paso','Arapahoe','Jefferson','Adams','Douglas','Larimer'],
  CT: ['Fairfield','Hartford','New Haven','Middlesex'],
  DE: ['New Castle','Kent','Sussex'],
  FL: ['Miami-Dade','Broward','Palm Beach','Hillsborough','Orange','Duval','Pinellas','Polk'],
  GA: ['Fulton','DeKalb','Cobb','Gwinnett','Clayton','Cherokee','Forsyth'],
  HI: ['Honolulu','Maui','Hawaii','Kauai'],
  ID: ['Ada','Canyon','Kootenai','Twin Falls','Bannock'],
  IL: ['Cook','DuPage','Lake','Will','Kane','McHenry','Winnebago'],
  IN: ['Marion','Hamilton','Allen','Lake','St. Joseph','Hendricks'],
  IA: ['Polk','Linn','Scott','Johnson','Black Hawk','Woodbury'],
  KS: ['Johnson','Sedgwick','Shawnee','Wyandotte','Douglas'],
  KY: ['Jefferson','Fayette','Kenton','Boone','Warren','Campbell'],
  LA: ['Jefferson','Orleans','Bossier','Caddo','St. Tammany','Lafayette'],
  ME: ['Cumberland','York','Penobscot','Kennebec','Androscoggin'],
  MD: ['Montgomery','Prince Georges','Baltimore','Anne Arundel','Howard','Frederick'],
  MA: ['Middlesex','Worcester','Essex','Suffolk','Norfolk','Bristol'],
  MI: ['Wayne','Oakland','Macomb','Kent','Genesee','Washtenaw','Ingham'],
  MN: ['Hennepin','Ramsey','Dakota','Anoka','Washington','Scott','Carver'],
  MS: ['Hinds','Harrison','DeSoto','Rankin','Forrest','Jackson'],
  MO: ['St. Louis City','Jackson','St. Charles','Jefferson','Greene','Boone'],
  MT: ['Yellowstone','Cascade','Missoula','Gallatin','Lewis and Clark'],
  NE: ['Douglas','Lancaster','Sarpy','Hall','Madison'],
  NV: ['Clark','Washoe','Carson City','Elko','Douglas'],
  NH: ['Hillsborough','Rockingham','Merrimack','Strafford','Grafton'],
  NJ: ['Bergen','Middlesex','Essex','Monmouth','Hudson','Union','Morris'],
  NM: ['Bernalillo','Dona Ana','Santa Fe','Sandoval','Valencia'],
  NY: ['Kings','Queens','New York','Suffolk','Bronx','Nassau','Westchester'],
  NC: ['Mecklenburg','Wake','Guilford','Forsyth','Durham','Cumberland','Buncombe'],
  ND: ['Cass','Burleigh','Grand Forks','Ward','Morton'],
  OH: ['Cuyahoga','Franklin','Hamilton','Summit','Montgomery','Stark','Butler'],
  OK: ['Oklahoma','Tulsa','Cleveland','Comanche','Canadian'],
  OR: ['Multnomah','Washington','Clackamas','Lane','Marion','Jackson','Deschutes'],
  PA: ['Philadelphia','Allegheny','Montgomery','Bucks','Delaware','Chester','Lancaster'],
  RI: ['Providence','Kent','Washington','Newport','Bristol'],
  SC: ['Greenville','Richland','Horry','Charleston','Lexington','Spartanburg'],
  SD: ['Minnehaha','Pennington','Lincoln','Brown','Codington'],
  TN: ['Shelby','Davidson','Knox','Hamilton','Rutherford','Williamson'],
  TX: ['Harris','Dallas','Tarrant','Bexar','Travis','Collin','Denton','Fort Bend','Montgomery','El Paso'],
  UT: ['Salt Lake','Utah','Davis','Weber','Washington','Cache','Tooele'],
  VT: ['Chittenden','Rutland','Washington','Windsor','Addison'],
  VA: ['Fairfax','Prince William','Loudoun','Chesterfield','Henrico','Virginia Beach City','Arlington'],
  WA: ['King','Pierce','Snohomish','Spokane','Clark','Thurston','Kitsap'],
  WV: ['Kanawha','Cabell','Berkeley','Monongalia','Putnam'],
  WI: ['Milwaukee','Waukesha','Dane','Brown','Racine','Outagamie'],
  WY: ['Laramie','Natrona','Campbell','Sweetwater','Fremont'],
  DC: ['District of Columbia'],
}

const STATES = US_STATES.map(([code, name]) => ({
  code,
  name,
  count: STATE_COUNTS[code] || 10_000,
  counties: STATE_COUNTIES[code] || [],
}))

function AssetClassCard({ entry, selected, onToggle }) {
  const Icon = Ic[entry.icon]
  return (
    <button className={`asset-card${selected ? ' selected' : ''}`} onClick={() => onToggle(entry.id)}>
      <div className="asset-card-check">
        <Ic.check width="11" height="11" />
      </div>
      <div className="asset-card-icon">
        <Icon width="20" height="20" />
      </div>
      <div className="asset-card-title">{entry.title}</div>
      <div className="asset-card-sub">{entry.sub}</div>
      <div className="asset-card-stat">
        <span>Tracked</span>
        <span className="asset-card-stat-num">{(entry.count / 1000).toFixed(0)}K</span>
      </div>
    </button>
  )
}

export function BuyBoxPage1({ form, setForm }) {
  const [stateQ, setStateQ] = useState('')
  const [geoTab, setGeoTab] = useState('counties')
  const [countyQ, setCountyQ] = useState('')
  const [metroQ, setMetroQ] = useState('')
  const [zipInput, setZipInput] = useState('')

  const sel = form.assets || []
  const subtypes = form.subtypes || []
  const geo = form.geo || { states: [], counties: [], metros: [], zips: [] }
  const counties = geo.counties || []
  const metros = geo.metros || []

  const [countyData, setCountyData] = useState({})
  const [countiesLoading, setCountiesLoading] = useState(false)
  const fetchedStatesRef = useRef(new Set())

  useEffect(() => {
    const toFetch = geo.states.filter(s => !fetchedStatesRef.current.has(s))
    if (!toFetch.length) return
    setCountiesLoading(true)
    api.get(`/api/dealfeed/geo/counties?states=${toFetch.join(',')}`)
      .then(data => {
        toFetch.forEach(s => fetchedStatesRef.current.add(s))
        setCountyData(prev => ({ ...prev, ...data.counties }))
      })
      .catch(() => {})
      .finally(() => setCountiesLoading(false))
  }, [geo.states])

  const selectedClass = sel.length === 1 ? DISPLAY_CLASSES.find(c => c.id === sel[0]) : null

  const toggleAsset = (id) => {
    const next = sel[0] === id ? [] : [id]
    setForm({ ...form, assets: next, subtypes: [] })
  }

  const toggleSubtype = (code) => {
    const active = subtypes.includes(code)
    if (!active && subtypes.length >= 3) return
    const next = active ? subtypes.filter(c => c !== code) : [...subtypes, code]
    setForm({ ...form, subtypes: next })
  }

  const toggleState = (code) => {
    if (geo.states.includes(code)) {
      setForm({
        ...form,
        geo: {
          ...geo,
          states: geo.states.filter(x => x !== code),
          counties: (geo.counties || []).filter(c => !c.startsWith(code + ':')),
        },
      })
    } else {
      setForm({
        ...form,
        geo: { ...geo, states: [...geo.states, code] },
      })
    }
  }

  const toggleCounty = (stateCode, countyName) => {
    const key = `${stateCode}:${countyName}`
    setForm({
      ...form,
      geo: {
        ...geo,
        counties: counties.includes(key)
          ? counties.filter(c => c !== key)
          : [...counties, key],
      },
    })
  }

  const toggleMetro = (metro) => {
    setForm({
      ...form,
      geo: {
        ...geo,
        metros: metros.includes(metro)
          ? metros.filter(m => m !== metro)
          : [...metros, metro],
      },
    })
  }

  const addZip = (e) => {
    if (e.key === 'Enter' && zipInput.match(/^\d{5}$/)) {
      if (!(geo.zips || []).includes(zipInput)) {
        setForm({
          ...form,
          geo: { ...geo, zips: [...(geo.zips || []), zipInput] },
        })
      }
      setZipInput('')
    } else if (e.key === 'Backspace' && !zipInput && (geo.zips || []).length) {
      setForm({
        ...form,
        geo: { ...geo, zips: (geo.zips || []).slice(0, -1) },
      })
    }
  }

  const stateList = STATES.filter(
    s => s.name.toLowerCase().includes(stateQ.toLowerCase()) || s.code.toLowerCase().includes(stateQ.toLowerCase())
  )

  const activeStates = STATES.filter(s => geo.states.includes(s.code))

  // Filter metros: by search query first; if states selected and no query, filter to those states
  const metroList = metroQ
    ? MAJOR_METROS.filter(m => m.toLowerCase().includes(metroQ.toLowerCase()))
    : activeStates.length > 0
      ? MAJOR_METROS.filter(m => activeStates.some(s => m.endsWith(', ' + s.code)))
      : MAJOR_METROS

  return (
    <div className="page-fade">
      <header className="page-head">
        <div className="page-eyebrow">
          <span className="mono-step mono">01/06</span>
          <span className="sep" />
          <span>Target</span>
        </div>
        <h1 className="page-title">What are you hunting?</h1>
        <p className="page-sub">Pick the asset class and geographies that fit your thesis. You can revise either at any time — every filter narrows the pool in the rail.</p>
      </header>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">A</span> Asset class
          </div>
          <span className="section-meta">{sel.length ? '1 selected' : 'pick one'}</span>
        </div>
        <div className="asset-grid">
          {DISPLAY_CLASSES.map(a => (
            <AssetClassCard key={a.id} entry={a} selected={sel.includes(a.id)} onToggle={toggleAsset} />
          ))}
        </div>
      </section>

      {selectedClass && (
        <section className="section subtype-section">
          <div className="section-head">
            <div className="section-title subtype-section-title">
              <span className="subtype-arrow">↳</span> Sub-asset class
            </div>
            <span className="section-meta">{subtypes.length}/3 selected · optional</span>
          </div>
          <div className="subtype-chips">
            {selectedClass.subtypes.map(st => {
              const active = subtypes.includes(st.code)
              const dim = !active && subtypes.length >= 3
              const Icon = SUBTYPE_ICONS[st.code]
              return (
                <button
                  key={st.code}
                  className={`subtype-chip${active ? ' active' : ''}${dim ? ' dim' : ''}`}
                  onClick={() => toggleSubtype(st.code)}
                >
                  {Icon && <Icon width="12" height="12" className="subtype-chip-icon" />}
                  {active && <span className="subtype-chip-check"><Ic.check width="10" height="10" /></span>}
                  {st.label}
                </button>
              )
            })}
          </div>
          <p className="subtype-hint">
            Pick up to 3 to narrow your pool. Leave all unselected to match every {selectedClass.title.toLowerCase()} type.
          </p>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">B</span> Geography
          </div>
          <span className="section-meta">
            {geo.states.length} states · {counties.length} counties · {metros.length} metros · {(geo.zips || []).length} zip codes
          </span>
        </div>

        <div className="geo-row">
          <div className="geo-block">
            <div className="geo-label">
              <span>States</span>
              <span className="geo-label-count">{geo.states.length}</span>
            </div>
            <div className="combo">
              <div className="combo-search">
                <Ic.search width="14" height="14" />
                <input placeholder="Search states..." value={stateQ} onChange={e => setStateQ(e.target.value)} />
              </div>
              <div className="combo-list">
                {stateList.map(s => {
                  const checked = geo.states.includes(s.code)
                  return (
                    <div
                      key={s.code}
                      className={`combo-item${checked ? ' checked' : ''}`}
                      onClick={() => toggleState(s.code)}
                    >
                      <div className="combo-item-label">
                        <span className="check"><Ic.check width="10" height="10" /></span>
                        <span style={{ fontSize: 13 }}>{s.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-mute)' }}>{s.code}</span>
                      </div>
                      <span className="combo-item-count">{(s.count / 1000).toFixed(0)}K</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="geo-block">
            <div className="geo-label">
              <span>{geoTab === 'counties' ? 'Counties' : 'Cities / Metros'}</span>
              <span className="geo-label-count">{geoTab === 'counties' ? counties.length : metros.length}</span>
            </div>

            <div className="geo-seg">
              <button className={`geo-seg-btn${geoTab === 'counties' ? ' active' : ''}`} onClick={() => setGeoTab('counties')}>Counties</button>
              <button className={`geo-seg-btn${geoTab === 'metros' ? ' active' : ''}`} onClick={() => setGeoTab('metros')}>Metros</button>
            </div>

            {geoTab === 'counties' ? (
              <div className="combo">
                <div className="combo-search">
                  <Ic.search width="14" height="14" />
                  <input
                    placeholder={activeStates.length ? 'Search counties…' : 'Select a state first…'}
                    value={countyQ}
                    onChange={e => setCountyQ(e.target.value)}
                    disabled={activeStates.length === 0}
                  />
                </div>
                <div className="combo-list">
                  {activeStates.length === 0 ? (
                    <div className="combo-empty">Select one or more states to see counties.</div>
                  ) : countiesLoading ? (
                    <div className="combo-empty">Loading counties…</div>
                  ) : (
                    activeStates.map(s => {
                      const allCounties = countyData[s.code] || STATE_COUNTIES[s.code] || []
                      const filtered = countyQ
                        ? allCounties.filter(c => c.toLowerCase().includes(countyQ.toLowerCase()))
                        : allCounties
                      if (filtered.length === 0) return null
                      return (
                        <Fragment key={s.code}>
                          {activeStates.length > 1 && (
                            <div className="combo-group-header">{s.name}</div>
                          )}
                          {filtered.map(c => {
                            const key = `${s.code}:${c}`
                            const checked = counties.includes(key)
                            return (
                              <div
                                key={key}
                                className={`combo-item${checked ? ' checked' : ''}`}
                                onClick={() => toggleCounty(s.code, c)}
                              >
                                <div className="combo-item-label">
                                  <span className="check"><Ic.check width="10" height="10" /></span>
                                  <span style={{ fontSize: 13 }}>{c}</span>
                                </div>
                              </div>
                            )
                          })}
                        </Fragment>
                      )
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="combo">
                <div className="combo-search">
                  <Ic.search width="14" height="14" />
                  <input
                    placeholder={activeStates.length ? `Metros in ${activeStates.map(s => s.code).join(', ')}…` : 'Search all metros…'}
                    value={metroQ}
                    onChange={e => setMetroQ(e.target.value)}
                  />
                </div>
                <div className="combo-list">
                  {metroList.length === 0 && (
                    <div className="combo-empty">No metros match your search.</div>
                  )}
                  {metroList.map(m => {
                    const checked = metros.includes(m)
                    return (
                      <div
                        key={m}
                        className={`combo-item${checked ? ' checked' : ''}`}
                        onClick={() => toggleMetro(m)}
                      >
                        <div className="combo-item-label">
                          <span className="check"><Ic.check width="10" height="10" /></span>
                          <span style={{ fontSize: 13 }}>{m}</span>
                        </div>
                      </div>
                    )
                  })}
                  {activeStates.length > 0 && metroList.length > 0 && !metroQ && (
                    <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--fg-mute)', borderTop: '1px solid var(--border-sub)' }}>
                      Showing metros in selected states. Clear search to see all.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="geo-label">
            <span>
              Specific ZIP codes<span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--fg-mute)', fontWeight: 400, marginLeft: 8 }}>· optional · type a 5-digit code and press Enter</span>
            </span>
            <span className="geo-label-count">{(geo.zips || []).length}</span>
          </div>
          <div className="chip-input">
            {(geo.zips || []).map(z => (
              <span key={z} className="chip">
                {z}
                <span className="chip-x" onClick={() => setForm({ ...form, geo: { ...geo, zips: (geo.zips || []).filter(x => x !== z) } })}>
                  <Ic.close width="10" height="10" />
                </span>
              </span>
            ))}
            <input
              placeholder={(geo.zips || []).length ? '' : '75205, 33139, 90025…'}
              value={zipInput}
              onChange={e => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyDown={addZip}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
