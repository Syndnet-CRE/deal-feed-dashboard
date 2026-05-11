import { useState } from 'react'
import { Ic } from './buybox-icons'

const ASSET_CLASSES = [
  { id: 'sfr', icon: 'sfr', title: 'Single-family', sub: 'Detached, 1 unit', count: 4_280_400 },
  { id: 'small_mf', icon: 'smm', title: 'Small multifamily', sub: '2–4 units', count: 1_104_800 },
  { id: 'large_mf', icon: 'lmm', title: 'Large multifamily', sub: '5+ units', count: 286_200 },
  { id: 'commercial', icon: 'commercial', title: 'Commercial', sub: 'Office, retail, mixed', count: 412_100 },
  { id: 'industrial', icon: 'industrial', title: 'Industrial', sub: 'Warehouse, flex', count: 198_400 },
  { id: 'mixed', icon: 'mixed', title: 'Mixed-use', sub: 'Live/work, vertical', count: 92_300 },
  { id: 'land', icon: 'land', title: 'Vacant land', sub: 'Lots & acreage', count: 1_840_000 },
  { id: 'hospitality', icon: 'hospitality', title: 'Hospitality', sub: 'Hotels, motels, STR', count: 64_800 },
]

const STATES = [
  { code: 'TX', name: 'Texas', count: 612_400, counties: ['Harris','Dallas','Tarrant','Bexar','Travis','Collin','Denton','Fort Bend'] },
  { code: 'FL', name: 'Florida', count: 488_200, counties: ['Miami-Dade','Broward','Palm Beach','Hillsborough','Orange','Duval'] },
  { code: 'CA', name: 'California', count: 612_900, counties: ['Los Angeles','San Diego','Orange','Riverside','San Bernardino','Sacramento'] },
  { code: 'GA', name: 'Georgia', count: 218_800, counties: ['Fulton','DeKalb','Cobb','Gwinnett','Clayton'] },
  { code: 'NC', name: 'North Carolina', count: 184_500, counties: ['Mecklenburg','Wake','Guilford','Forsyth','Durham'] },
  { code: 'AZ', name: 'Arizona', count: 162_300, counties: ['Maricopa','Pima','Pinal','Yavapai'] },
  { code: 'OH', name: 'Ohio', count: 196_200, counties: ['Cuyahoga','Franklin','Hamilton','Summit','Montgomery'] },
  { code: 'TN', name: 'Tennessee', count: 142_700, counties: ['Davidson','Shelby','Knox','Hamilton'] },
  { code: 'CO', name: 'Colorado', count: 121_400, counties: ['Denver','El Paso','Arapahoe','Jefferson','Adams'] },
  { code: 'PA', name: 'Pennsylvania', count: 178_900, counties: ['Philadelphia','Allegheny','Montgomery','Bucks'] },
  { code: 'IL', name: 'Illinois', count: 188_400, counties: ['Cook','DuPage','Lake','Will','Kane'] },
  { code: 'NV', name: 'Nevada', count: 82_100, counties: ['Clark','Washoe','Carson City'] },
]

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

function CountyList({ state, selectedCounties, onToggle, q }) {
  const filtered = state.counties.filter(c => c.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      {filtered.map(c => {
        const key = `${state.code}:${c}`
        const checked = selectedCounties.includes(key)
        const cnt = Math.round((state.count / state.counties.length) * (0.6 + Math.random() * 0.8))
        return (
          <div key={key} className={`combo-item${checked ? ' checked' : ''}`} onClick={() => onToggle(key)}>
            <div className="combo-item-label">
              <span className="check"><Ic.check width="10" height="10" /></span>
              <span style={{ fontSize: 13 }}>{c} County</span>
            </div>
            <span className="combo-item-count">{(cnt / 1000).toFixed(1)}K</span>
          </div>
        )
      })}
    </>
  )
}

export function BuyBoxPage1({ form, setForm }) {
  const [stateQ, setStateQ] = useState('')
  const [countyQ, setCountyQ] = useState('')
  const [zipInput, setZipInput] = useState('')

  const sel = form.assets || []
  const geo = form.geo || { states: [], counties: [], zips: [] }

  const toggleAsset = (id) => {
    setForm({
      ...form,
      assets: sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id],
    })
  }

  const toggleState = (code) => {
    if (geo.states.includes(code)) {
      setForm({
        ...form,
        geo: {
          ...geo,
          states: geo.states.filter(x => x !== code),
          counties: geo.counties.filter(c => !c.startsWith(code + ':')),
        },
      })
    } else {
      setForm({
        ...form,
        geo: { ...geo, states: [...geo.states, code] },
      })
    }
  }

  const toggleCounty = (key) => {
    setForm({
      ...form,
      geo: {
        ...geo,
        counties: geo.counties.includes(key)
          ? geo.counties.filter(c => c !== key)
          : [...geo.counties, key],
      },
    })
  }

  const addZip = (e) => {
    if (e.key === 'Enter' && zipInput.match(/^\d{5}$/)) {
      if (!geo.zips.includes(zipInput)) {
        setForm({
          ...form,
          geo: { ...geo, zips: [...geo.zips, zipInput] },
        })
      }
      setZipInput('')
    } else if (e.key === 'Backspace' && !zipInput && geo.zips.length) {
      setForm({
        ...form,
        geo: { ...geo, zips: geo.zips.slice(0, -1) },
      })
    }
  }

  const stateList = STATES.filter(
    s => s.name.toLowerCase().includes(stateQ.toLowerCase()) || s.code.toLowerCase().includes(stateQ.toLowerCase())
  )
  const activeStates = STATES.filter(s => geo.states.includes(s.code))

  return (
    <div className="page-fade">
      <header className="page-head">
        <div className="page-eyebrow">
          <span className="mono-step mono">01 / 06</span>
          <span className="sep" />
          <span>Target</span>
        </div>
        <h1 className="page-title">What are you hunting?</h1>
        <p className="page-sub">Pick the asset classes and geographies that fit your thesis. You can revise either at any time.</p>
      </header>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">A</span> Asset class
          </div>
          <span className="section-meta">{sel.length || 0} selected · multi-select</span>
        </div>
        <div className="asset-grid">
          {ASSET_CLASSES.map(a => (
            <AssetClassCard key={a.id} entry={a} selected={sel.includes(a.id)} onToggle={toggleAsset} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">B</span> Geography
          </div>
          <span className="section-meta">
            {geo.states.length} states · {geo.counties.length} counties · {geo.zips.length} zip codes
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
              <span>Counties</span>
              <span className="geo-label-count">{geo.counties.length}</span>
            </div>
            <div className="combo">
              <div className="combo-search">
                <Ic.search width="14" height="14" />
                <input
                  placeholder={activeStates.length ? 'Search counties...' : 'Pick states first →'}
                  value={countyQ}
                  onChange={e => setCountyQ(e.target.value)}
                  disabled={!activeStates.length}
                />
              </div>
              <div className="combo-list">
                {activeStates.length === 0 && (
                  <div style={{ padding: '24px 14px', fontSize: 12, color: 'var(--fg-mute)', textAlign: 'center' }}>
                    Select at least one state to drill into counties.
                  </div>
                )}
                {activeStates.map(s => (
                  <div key={s.code}>
                    <div style={{ padding: '8px 14px 4px', fontSize: 10, color: 'var(--fg-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      {s.name}
                    </div>
                    <CountyList state={s} selectedCounties={geo.counties} onToggle={toggleCounty} q={countyQ} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="geo-label">
            <span>
              Specific ZIP codes<span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--fg-mute)', fontWeight: 400, marginLeft: 8 }}>· optional · type a 5-digit code and press Enter</span>
            </span>
            <span className="geo-label-count">{geo.zips.length}</span>
          </div>
          <div className="chip-input">
            {geo.zips.map(z => (
              <span key={z} className="chip">
                {z}
                <span className="chip-x" onClick={() => setForm({ ...form, geo: { ...geo, zips: geo.zips.filter(x => x !== z) } })}>
                  <Ic.close width="10" height="10" />
                </span>
              </span>
            ))}
            <input
              placeholder={geo.zips.length ? '' : '75205, 33139, 90025…'}
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
