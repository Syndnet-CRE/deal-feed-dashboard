import { fmt, hasVal } from '../../lib/format';

function isValidHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function ClimateScore({ label, score }) {
  if (score == null) return null;
  const color = score >= 7 ? "#E5484D" : score >= 4 ? "#F4B73E" : "#5BCC48";
  return (
    <>
      <span className="k">{label}</span>
      <span className="v" style={{ color, fontWeight: 700 }}>{score}/10</span>
    </>
  );
}

export function SiteTab({ deal }) {
  const bj = deal.briefJson || {};
  return (
    <>
      <div className="pd-section">
        <div className="pd-sec-head"><h3>Parcel Details</h3></div>
        <div className="kv-grid">
          <span className="k">APN</span><span className="v">{deal.apn}</span>
          {hasVal(bj.apn2) && <><span className="k">APN 2</span><span className="v">{fmt(bj.apn2)}</span></>}
          <span className="k">FIPS</span><span className="v">{deal.fips || "—"}</span>
          <span className="k">Census Tract</span><span className="v">{deal.censusTract}</span>
          {hasVal(bj.census_block) && <><span className="k">Census Block</span><span className="v">{fmt(bj.census_block)}</span></>}
          <span className="k">Lot Acreage</span><span className="v">{deal.acres?.toFixed(2)} ac</span>
          <span className="k">GIS Acreage</span><span className="v">{deal.gisAcres?.toFixed(2)} ac</span>
          {hasVal(bj.bldg_lot_depth) && <><span className="k">Lot Depth</span><span className="v">{bj.bldg_lot_depth} ft</span></>}
          {hasVal(bj.bldg_lot_width) && <><span className="k">Lot Width</span><span className="v">{bj.bldg_lot_width} ft</span></>}
          <span className="k">Zoning</span><span className="v">{deal.zoning}</span>
          {hasVal(bj.gis_zoning_desc) && <><span className="k">Zoning Desc</span><span className="v">{fmt(bj.gis_zoning_desc)}</span></>}
          {hasVal(bj.gis_future_land_use) && <><span className="k">Future Land Use</span><span className="v">{fmt(bj.gis_future_land_use)}</span></>}
          {hasVal(bj.gis_overlay_districts) && <><span className="k">Overlay Districts</span><span className="v">{fmt(bj.gis_overlay_districts)}</span></>}
          <span className="k">Land Use</span><span className="v">{deal.asset}</span>
          {hasVal(bj.legal_subdivision) && <><span className="k">Subdivision</span><span className="v">{fmt(bj.legal_subdivision)}</span></>}
          {hasVal(bj.jurisdiction) && <><span className="k">Jurisdiction</span><span className="v">{fmt(bj.jurisdiction)}</span></>}
          {bj.gis_tif_district && <><span className="k">TIF District</span><span className="v" style={{ color: "var(--green)" }}>{fmt(bj.gis_tif_district)}</span></>}
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Improvements</h3></div>
        <div className="kv-grid">
          {deal.sf && <><span className="k">Building SF</span><span className="v">{deal.sf.toLocaleString()} SF</span></>}
          {deal.yearBuilt && <><span className="k">Year Built</span><span className="v">{deal.yearBuilt}</span></>}
          {hasVal(bj.bldg_construction_type) && <><span className="k">Construction</span><span className="v">{fmt(bj.bldg_construction_type)}</span></>}
          {hasVal(bj.bldg_exterior_walls)    && <><span className="k">Exterior Walls</span><span className="v">{fmt(bj.bldg_exterior_walls)}</span></>}
          {hasVal(bj.bldg_roof_material)     && <><span className="k">Roof</span><span className="v">{fmt(bj.bldg_roof_material)}</span></>}
          {hasVal(bj.bldg_foundation_type)   && <><span className="k">Foundation</span><span className="v">{fmt(bj.bldg_foundation_type)}</span></>}
          {hasVal(bj.bldg_quality_grade)     && <><span className="k">Quality Grade</span><span className="v">{fmt(bj.bldg_quality_grade)}</span></>}
          {hasVal(bj.bldg_condition)         && <><span className="k">Condition</span><span className="v">{fmt(bj.bldg_condition)}</span></>}
          {hasVal(bj.bldg_fire_resistance_class) && <><span className="k">Fire Resistance</span><span className="v">{fmt(bj.bldg_fire_resistance_class)}</span></>}
          {bj.bldg_parking_spaces > 0 && <><span className="k">Parking Spaces</span><span className="v">{bj.bldg_parking_spaces}</span></>}
          {hasVal(bj.bldg_hvac_cooling) && <><span className="k">HVAC Cooling</span><span className="v">{fmt(bj.bldg_hvac_cooling)}</span></>}
          {hasVal(bj.bldg_hvac_heating) && <><span className="k">HVAC Heating</span><span className="v">{fmt(bj.bldg_hvac_heating)}</span></>}
          {bj.bldg_has_elevator         && <><span className="k">Elevator</span><span className="v">Yes</span></>}
          {bj.bldg_has_fire_sprinklers  && <><span className="k">Fire Sprinklers</span><span className="v">Yes</span></>}
          {bj.bldg_has_overhead_door    && <><span className="k">Overhead Door</span><span className="v">Yes</span></>}
          {bj.bldg_has_loading_platform && <><span className="k">Loading Platform</span><span className="v">{bj.bldg_loading_platform_area ? `${bj.bldg_loading_platform_area} SF` : "Yes"}</span></>}
          {bj.bldg_has_canopy           && <><span className="k">Canopy</span><span className="v">{bj.bldg_canopy_area ? `${bj.bldg_canopy_area} SF` : "Yes"}</span></>}
          {hasVal(bj.bldg_view_description)  && <><span className="k">View</span><span className="v">{fmt(bj.bldg_view_description)}</span></>}
          {hasVal(bj.bldg_topography_code)   && <><span className="k">Topography</span><span className="v">{fmt(bj.bldg_topography_code)}</span></>}
          {isValidHttpUrl(bj.intel_website_url) && <><span className="k">Website</span><span className="v"><a href={bj.intel_website_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>{bj.intel_website_url}</a></span></>}
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Utilities &amp; Access</h3></div>
        <div className="kv-grid">
          <span className="k">Water Source</span><span className="v">{fmt(bj.bldg_water_source)}</span>
          <span className="k">Sewage Type</span><span className="v">{fmt(bj.bldg_sewage_type)}</span>
          {hasVal(bj.gis_utility_proximity) && <><span className="k">Utility Proximity</span><span className="v">{fmt(bj.gis_utility_proximity)}</span></>}
          {bj.gis_nearest_water_ft  != null && <><span className="k">Water Line</span><span className="v">{Number(bj.gis_nearest_water_ft).toLocaleString()} ft</span></>}
          {bj.gis_nearest_sewer_ft  != null && <><span className="k">Sewer Line</span><span className="v">{Number(bj.gis_nearest_sewer_ft).toLocaleString()} ft</span></>}
          {bj.gis_nearest_storm_ft  != null && <><span className="k">Storm Drain</span><span className="v">{Number(bj.gis_nearest_storm_ft).toLocaleString()} ft</span></>}
          {hasVal(bj.nearest_road_name) && <><span className="k">Nearest Road</span><span className="v">{fmt(bj.nearest_road_name)}{bj.nearest_road_aadt ? ` · ${Number(bj.nearest_road_aadt).toLocaleString()} AADT` : ""}</span></>}
          {bj.nearest_substation_ft  != null && <><span className="k">Substation</span><span className="v">{Number(bj.nearest_substation_ft).toLocaleString()} ft{hasVal(bj.nearest_substation_name) ? ` · ${bj.nearest_substation_name}` : ""}</span></>}
          {bj.nearest_rail_yard_ft   != null && <><span className="k">Rail Yard</span><span className="v">{Number(bj.nearest_rail_yard_ft).toLocaleString()} ft{hasVal(bj.nearest_rail_yard_name) ? ` · ${bj.nearest_rail_yard_name}` : ""}</span></>}
        </div>
      </div>

      <div className="pd-section">
        <div className="pd-sec-head"><h3>Environmental &amp; Flood</h3></div>
        <div className="kv-grid">
          <span className="k">FEMA Flood Zone</span>
          <span className="v">
            {hasVal(bj.gis_flood_zone)
              ? <span className={`pill ${(bj.gis_flood_zone || "").startsWith("A") || (bj.gis_flood_zone || "").startsWith("V") ? "amber" : "gray"}`} style={{ fontSize: 10 }}>{bj.gis_flood_zone}</span>
              : "—"}
          </span>
          <span className="k">In Floodplain</span><span className="v">{bj.gis_in_floodplain ? <span className="pill amber" style={{ fontSize: 10 }}>Yes</span> : "No"}</span>
          <span className="k">In Floodway</span><span className="v">{bj.gis_in_floodway ? <span className="pill amber" style={{ fontSize: 10 }}>Yes</span> : "No"}</span>
          {hasVal(bj.gis_flood_source) && <><span className="k">Flood Source</span><span className="v">{fmt(bj.gis_flood_source)}</span></>}
          <span className="k">Wetlands</span><span className="v">{bj.gis_wetlands ? <span className="pill amber" style={{ fontSize: 10 }}>Present</span> : "No"}</span>
          {hasVal(bj.climate_fema_flood_risk) && <><span className="k">Flood Risk (FEMA)</span><span className="v">{fmt(bj.climate_fema_flood_risk)}</span></>}
          {bj.climate_flood_depth_future != null && <><span className="k">Future Flood Depth</span><span className="v">{bj.climate_flood_depth_future} in</span></>}
        </div>
      </div>

      {(bj.elev_mean != null || bj.elev_slope_pct != null) && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Elevation &amp; Topography</h3></div>
          <div className="kv-grid">
            {bj.elev_mean    != null && <><span className="k">Elevation (Mean)</span><span className="v">{bj.elev_mean} ft</span></>}
            {bj.elev_min     != null && <><span className="k">Elevation (Min)</span><span className="v">{bj.elev_min} ft</span></>}
            {bj.elev_max     != null && <><span className="k">Elevation (Max)</span><span className="v">{bj.elev_max} ft</span></>}
            {bj.elev_slope_pct != null && <><span className="k">Avg Slope</span><span className="v">{bj.elev_slope_pct}%</span></>}
            {hasVal(bj.elev_slope_tier)    && <><span className="k">Slope Tier</span><span className="v">{fmt(bj.elev_slope_tier)}</span></>}
            {bj.elev_grading_score != null && <><span className="k">Grading Score</span><span className="v">{bj.elev_grading_score}/10</span></>}
            {bj.elev_flood_proxy   != null && <><span className="k">Flood Proxy Score</span><span className="v">{bj.elev_flood_proxy}/10</span></>}
          </div>
        </div>
      )}

      {bj.climate_total_risk_score != null && (
        <div className="pd-section">
          <div className="pd-sec-head"><h3>Climate Risk Scores</h3><span className="upd">1–10 scale · 10 = highest risk</span></div>
          <div className="kv-grid">
            <ClimateScore label="Flood" score={bj.climate_flood_risk_score}/>
            <ClimateScore label="Heat" score={bj.climate_heat_risk_score}/>
            <ClimateScore label="Wind" score={bj.climate_wind_risk_score}/>
            <ClimateScore label="Storm" score={bj.climate_storm_risk_score}/>
            <ClimateScore label="Wildfire" score={bj.climate_wildfire_risk_score}/>
            <ClimateScore label="Drought" score={bj.climate_drought_risk_score}/>
            <ClimateScore label="Air Quality" score={bj.climate_air_quality_score}/>
            <ClimateScore label="Total Risk" score={bj.climate_total_risk_score}/>
          </div>
        </div>
      )}
    </>
  );
}
