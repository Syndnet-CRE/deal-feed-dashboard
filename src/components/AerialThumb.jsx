import { useMemo, useState } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function aerialUrl(lat, lng, large) {
  const size = large ? '600x400' : '400x400';
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${lng},${lat},16/${size}@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`;
}

function rand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function SvgFallback({ id, large, showParcel }) {
  const patches = useMemo(() => {
    const r2 = rand((typeof id === "string" ? id.charCodeAt(0) * 31 + id.length * 7 : id) || 11);
    const out = [];
    const cnt = large ? 28 : 18;
    for (let i = 0; i < cnt; i++) {
      out.push({
        x: r2() * 100, y: r2() * 100,
        w: 6 + r2() * 28, h: 5 + r2() * 22,
        rot: (r2() - 0.5) * 30,
        kind: r2() < 0.45 ? "asphalt" : r2() < 0.75 ? "field" : r2() < 0.9 ? "building" : "trees"
      });
    }
    return out;
  }, [id, large]);

  const colors = { asphalt: "#3A3F32", field: "#5A5F2C", building: "#7A7060", trees: "#2A3A1F" };

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id={`bgA-${id}`} cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#3F4A2C"/>
          <stop offset="100%" stopColor="#1F2418"/>
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#bgA-${id})`}/>
      {patches.map((p, i) => (
        <g key={i} transform={`rotate(${p.rot} ${p.x} ${p.y})`}>
          <rect x={p.x - p.w/2} y={p.y - p.h/2} width={p.w} height={p.h}
            fill={colors[p.kind]}
            opacity={p.kind === "trees" ? 0.85 : 0.7}
            rx={p.kind === "building" ? 0.3 : 0}
          />
        </g>
      ))}
      <path d="M -5 70 C 30 65, 60 80, 110 60" stroke="#2C2F26" strokeWidth="6" fill="none" opacity="0.85"/>
      <path d="M -5 70 C 30 65, 60 80, 110 60" stroke="#5C5F46" strokeWidth="0.4" fill="none" strokeDasharray="2 2" opacity="0.5"/>
      {showParcel && (
        <rect x="22" y="20" width="56" height="50" fill="rgba(29,175,41,0.10)" stroke="#1DAF29" strokeWidth="1.2" strokeDasharray="2 1.5"/>
      )}
    </svg>
  );
}

export function AerialThumb({ id = 0, lat, lng, large = false, showParcel = true }) {
  const [imgError, setImgError] = useState(false);
  const hasCoords = lat && lng && MAPBOX_TOKEN;

  if (hasCoords && !imgError) {
    return (
      <img
        src={aerialUrl(lat, lng, large)}
        onError={() => setImgError(true)}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
        alt=""
        loading="lazy"
      />
    );
  }

  return <SvgFallback id={id} large={large} showParcel={showParcel}/>;
}
