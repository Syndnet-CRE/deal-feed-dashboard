import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDeals } from '../contexts/DealsContext.jsx';
import { fmtMoney } from '../lib/format.js';

function sfLabel(v) {
  if (!v) return '—';
  return Number(v).toLocaleString() + ' sf';
}

function drawGraph(svgEl, portfolio, sourceAddress) {
  const props = (portfolio.properties || []).slice(0, 24);
  if (!props.length) return;

  const nodes = [
    { id: 'source', label: sourceAddress || 'This Property', isSource: true },
    ...props.map(p => ({
      id: String(p.attom_id),
      label: p.address_full || p.address || String(p.attom_id),
      matchedBy: p.matched_by,
    })),
  ];

  const links = props.map(p => ({
    source: 'source',
    target: String(p.attom_id),
    label: p.matched_by || '',
  }));

  const w = svgEl.getBoundingClientRect().width || 560;
  const h = 260;

  const svg = d3.select(svgEl).attr('viewBox', `0 0 ${w} ${h}`);
  svg.selectAll('*').remove();

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(110))
    .force('charge', d3.forceManyBody().strength(-220))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force('collision', d3.forceCollide(26))
    .alphaDecay(0.04);

  const edgeColor = m => m === 'name' ? '#3E7BFA' : m === 'address' ? '#F4B73E' : '#1DAF29';

  const link = svg.append('g').selectAll('line')
    .data(links).join('line')
    .attr('stroke', d => edgeColor(d.label))
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.5);

  const linkLabel = svg.append('g').selectAll('text')
    .data(links).join('text')
    .text(d => d.label)
    .attr('font-size', 9)
    .attr('fill', '#9DA2B3')
    .attr('text-anchor', 'middle');

  const node = svg.append('g').selectAll('g')
    .data(nodes).join('g');

  node.append('circle')
    .attr('r', d => d.isSource ? 20 : 14)
    .attr('fill', d => d.isSource ? '#1DAF29' : '#D9E8FB')
    .attr('stroke', d => d.isSource ? '#0E7A18' : '#3E7BFA')
    .attr('stroke-width', 2);

  node.filter(d => d.isSource).append('text')
    .text('★')
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
    .attr('font-size', 13).attr('fill', '#fff').attr('font-weight', 'bold');

  node.filter(d => !d.isSource).append('text')
    .text(d => d.matchedBy === 'name' ? 'N' : d.matchedBy === 'address' ? 'A' : 'B')
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
    .attr('font-size', 9).attr('fill', '#0F4A99').attr('font-weight', 'bold');

  node.append('title').text(d => d.label);

  sim.on('tick', () => {
    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    linkLabel
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2 - 4);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  sim.on('end', () => sim.stop());
}

export function OwnerPortfolio({ deal }) {
  const { portfolios, fetchOwnerPortfolio } = useDeals();
  const svgRef = useRef(null);
  const attomId = deal.attomId || deal.attom_id;
  const portfolio = portfolios[attomId];

  useEffect(() => {
    if (attomId) fetchOwnerPortfolio(attomId);
  }, [attomId, fetchOwnerPortfolio]);

  useEffect(() => {
    if (portfolio && portfolio.properties?.length && svgRef.current) {
      drawGraph(svgRef.current, portfolio, deal.address);
    }
  }, [portfolio, deal.address]);

  if (!attomId) return null;

  if (portfolio === undefined) {
    return <p className="dd-portfolio-loading">Loading owner portfolio…</p>;
  }

  if (!portfolio) {
    return <p className="dd-portfolio-empty">Portfolio data unavailable for this owner.</p>;
  }

  const props = portfolio.properties || [];
  const totals = portfolio.totals || {};

  return (
    <div className="dd-portfolio-root">
      <div className="dd-portfolio-header">
        <span className="dd-portfolio-owner">{deal.owner_name || portfolio.owner_vectors?.owner_name || '—'}</span>
        {totals.property_count > 0 && (
          <span className="dd-portfolio-count">{totals.property_count} linked propert{totals.property_count === 1 ? 'y' : 'ies'}</span>
        )}
      </div>

      {props.length > 0 ? (
        <>
          <svg ref={svgRef} className="dd-portfolio-graph" style={{ width: '100%', height: 260, display: 'block' }} />
          <div className="dd-portfolio-legend">
            <span className="dd-portfolio-legend-item"><span style={{ color: '#3E7BFA' }}>■</span> Name match</span>
            <span className="dd-portfolio-legend-item"><span style={{ color: '#F4B73E' }}>■</span> Address match</span>
            <span className="dd-portfolio-legend-item"><span style={{ color: '#1DAF29' }}>■</span> Both</span>
          </div>
          <div className="dd-portfolio-table-wrap">
            <table className="dd-table dd-portfolio-table">
              <thead>
                <tr>
                  <th>Address</th><th>Asset Class</th><th>Assessed</th>
                  <th>Bldg SF</th><th>Acres</th><th>Match</th>
                </tr>
              </thead>
              <tbody>
                {props.map((p, i) => (
                  <tr key={i} className="dd-portfolio-row">
                    <td>{p.address_full || p.address || '—'}</td>
                    <td className="muted">{p.asset_class || p.resolved_asset_type || '—'}</td>
                    <td>{fmtMoney(p.assessed_value ?? p.tax_assessed_total)}</td>
                    <td>{sfLabel(p.building_sf ?? p.area_building)}</td>
                    <td>{p.acres ?? p.area_lot_acres ? Number(p.acres ?? p.area_lot_acres).toFixed(2) + ' ac' : '—'}</td>
                    <td><span className={`dd-pill ${p.matched_by === 'both' ? 'green' : p.matched_by === 'name' ? 'blue' : 'amber'}`}>{p.matched_by || '—'}</span></td>
                  </tr>
                ))}
                {totals.property_count > 0 && (
                  <tr className="dd-portfolio-totals">
                    <td colSpan={2}><strong>Portfolio Total</strong></td>
                    <td>{fmtMoney(totals.total_assessed_value)}</td>
                    <td>{sfLabel(totals.total_building_sf)}</td>
                    <td>{totals.total_acreage ? Number(totals.total_acreage).toFixed(2) + ' ac' : '—'}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="dd-portfolio-empty">No other linked properties found for this owner.</p>
      )}
    </div>
  );
}
