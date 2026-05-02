import { useState } from 'react';
import { DEALS } from '../data/mockData';
import { I } from '../components/Icons';
import { DealCard, MapPin } from '../components/DealComponents';
import { MapBackground } from '../components/MapBackground';

function Sparkline({ data, color = "#1DAF29" }) {
  const w = 80, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"/>
      <polyline points={`${pts} ${w},${h} 0,${h}`} fill={color} opacity="0.12"/>
    </svg>
  );
}

function StatCard({ label, num, trend, trendLabel, spark, sparkColor }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="num">{num}</div>
      <div className={`trend ${trend}`}>
        {trend === "up" && <I.Trend size={12}/>}
        <span>{trendLabel}</span>
      </div>
      {spark && <Sparkline data={spark} color={sparkColor}/>}
    </div>
  );
}

export function DashboardView({ onOpenDeal, selectedId }) {
  const recentDeals = DEALS.slice(0, 8);
  const last7 = DEALS.filter(d => d.days <= 7);
  const [pinHover, setPinHover] = useState(null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">Last nightly run completed Apr 30, 2026 at 02:14 EDT · 12 new deals across 4 buy boxes</div>
        </div>
        <div className="spaced">
          <span className="pill green"><span className="pip"/>Run Healthy</span>
          <button className="btn"><I.Calendar size={13}/> This Week</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Deals · All Time" num="412" trend="up" trendLabel="+12 this run" spark={[200, 220, 250, 290, 320, 360, 388, 412]}/>
        <StatCard label="Deals · This Week" num="34" trend="up" trendLabel="+27% vs last week" spark={[6, 8, 5, 9, 4, 12, 8]} sparkColor="#5BCC48"/>
        <StatCard label="Active Buy Boxes" num="4" trend="flat" trendLabel="2 slots remaining" spark={[3, 3, 4, 4, 4, 4, 4]} sparkColor="#9DA2B3"/>
        <StatCard label="Top Distress · Tonight" num="91" trend="up" trendLabel="Hamlin Industrial Blvd" spark={[72, 78, 81, 84, 82, 88, 91]}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <div className="panel-title">Recent Deals</div>
              <div className="panel-sub">Most recent across all buy boxes · click to open detail</div>
            </div>
            <div className="seg">
              <button className="seg-btn active">All Boxes</button>
              <button className="seg-btn">IOS</button>
              <button className="seg-btn">Storage</button>
              <button className="seg-btn">Land</button>
            </div>
          </div>
          <div>
            {recentDeals.map(d => (
              <DealCard key={d.id} deal={d} selected={pinHover === d.id || selectedId === d.id} onClick={() => onOpenDeal(d)}/>
            ))}
          </div>
        </div>

        <div className="panel-card" style={{ position: "sticky", top: 0 }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Last 7 Days · Map</div>
              <div className="panel-sub">{last7.length} deals delivered</div>
            </div>
            <button className="btn sm"><I.External size={11}/> Open Map</button>
          </div>
          <div className="mini-map">
            <MapBackground/>
            {last7.map((d, i) => (
              <div key={d.id} onMouseEnter={() => setPinHover(d.id)} onMouseLeave={() => setPinHover(null)}>
                <MapPin deal={d} x={d.x * 100} y={d.y * 100} num={i + 1} selected={pinHover === d.id} onClick={() => onOpenDeal(d)}/>
              </div>
            ))}
            <div className="scale-bar"><span className="bar"/>5 mi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
