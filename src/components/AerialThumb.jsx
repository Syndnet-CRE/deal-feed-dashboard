import { useMemo } from 'react';

function rand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function AerialThumb({ id = 0, large = false, showParcel = true }) {
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
