import { useState } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { DEALS as MOCK_DEALS } from '../data/mockData';
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
  const { deals: apiDeals, loading } = useDeals();
  const deals = (!loading && apiDeals.length === 0) ? MOCK_DEALS : apiDeals;
  const [pinHover, setPinHover] = useState(null);

  const recentDeals = deals.slice(0, 8);
  const last7 = deals.filter(d => d.days <= 7);
  const hotCount = deals.filter(d => d.fb === 'hot').length;
  const topScore = deals.length > 0 ? Math.max(...deals.map(d => d.score)) : 0;
  const topDeal = deals.find(d => d.score === topScore);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">
            {loading ? 'Loading…' : `${deals.length} total deals across all buy boxes`}
          </div>
        </div>
        <div className="spaced">
          <span className="pill green"><span className="pip"/>Run Healthy</span>
          <button className="btn"><I.Calendar size={13}/> This Week</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Total Deals · All Time"
          num={loading ? '…' : deals.length}
          trend="up"
          trendLabel="across all buy boxes"
          spark={[200, 220, 250, 290, 320, 360, 388, Math.max(deals.length, 412)]}
        />
        <StatCard
          label="Deals · Last 7 Days"
          num={loading ? '…' : last7.length}
          trend="up"
          trendLabel="delivered this week"
          spark={[6, 8, 5, 9, 4, 12, Math.max(last7.length, 8)]}
          sparkColor="#5BCC48"
        />
        <StatCard
          label="Hot Deals"
          num={loading ? '…' : hotCount}
          trend="flat"
          trendLabel="marked hot by you"
          spark={[0, 1, 1, 2, 2, 3, Math.max(hotCount, 3)]}
          sparkColor="#9DA2B3"
        />
        <StatCard
          label="Top Distress Score"
          num={loading ? '…' : topScore}
          trend="up"
          trendLabel={topDeal ? topDeal.addr.split(' ').slice(0, 3).join(' ') : '—'}
          spark={[72, 78, 81, 84, 82, 88, Math.max(topScore, 91)]}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <div className="panel-title">Recent Deals</div>
              <div className="panel-sub">Most recent across all buy boxes · click to open detail</div>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 24, color: "#9DA2B3", fontSize: 13 }}>Loading deals…</div>
          ) : recentDeals.length === 0 ? (
            <div style={{ padding: 24, color: "#9DA2B3", fontSize: 13 }}>No deals delivered yet. Your first nightly run will populate this.</div>
          ) : (
            <div>
              {recentDeals.map(d => (
                <DealCard key={d.id} deal={d} selected={pinHover === d.id || selectedId === d.id} onClick={() => onOpenDeal(d)}/>
              ))}
            </div>
          )}
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
                <MapPin deal={d} x={(d.x || 0.5) * 100} y={(d.y || 0.5) * 100} num={i + 1} selected={pinHover === d.id} onClick={() => onOpenDeal(d)}/>
              </div>
            ))}
            <div className="scale-bar"><span className="bar"/>5 mi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
