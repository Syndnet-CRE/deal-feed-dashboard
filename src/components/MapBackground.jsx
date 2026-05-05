import { useMemo } from 'react';

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function MapBackground({ width = 1200, height = 800, density = 1, satellite = false }) {
  const streets = useMemo(() => {
    const r2 = seedRand(7);
    const lines = [];
    lines.push({ d: "M -50 220 C 200 180, 480 320, 720 280 S 1100 360, 1300 320", w: 4, c: "#3a3d49" });
    lines.push({ d: "M 150 -50 C 220 200, 180 460, 260 720 S 320 900, 360 1100", w: 4, c: "#3a3d49" });
    lines.push({ d: "M -50 600 C 240 580, 540 660, 800 620 S 1100 700, 1300 670", w: 3.5, c: "#3a3d49" });
    lines.push({ d: "M 600 -50 C 640 220, 600 460, 690 720 S 740 920, 770 1100", w: 3.5, c: "#3a3d49" });
    lines.push({ d: "M 950 -50 C 980 240, 940 500, 1020 760 S 1060 950, 1100 1100", w: 3, c: "#3a3d49" });
    for (let i = 0; i < 18 * density; i++) {
      const y = r2() * height;
      const y2 = y + (r2() - 0.5) * 80;
      lines.push({ d: `M -20 ${y} C ${width * 0.3} ${y + (r2() - 0.5) * 60}, ${width * 0.65} ${y2}, ${width + 20} ${y2 + (r2() - 0.5) * 40}`, w: 1.6, c: "#2a2c36" });
    }
    for (let i = 0; i < 14 * density; i++) {
      const x = r2() * width;
      const x2 = x + (r2() - 0.5) * 60;
      lines.push({ d: `M ${x} -20 C ${x + (r2() - 0.5) * 50} ${height * 0.3}, ${x2} ${height * 0.6}, ${x2 + (r2() - 0.5) * 50} ${height + 20}`, w: 1.4, c: "#2a2c36" });
    }
    for (let i = 0; i < 60 * density; i++) {
      const x = r2() * width;
      const y = r2() * height;
      const len = 40 + r2() * 80;
      const horiz = r2() > 0.5;
      lines.push({ d: horiz ? `M ${x} ${y} L ${x + len} ${y + (r2() - 0.5) * 8}` : `M ${x} ${y} L ${x + (r2() - 0.5) * 8} ${y + len}`, w: 0.8, c: "#23252e" });
    }
    return lines;
  }, [width, height, density]);

  const blocks = useMemo(() => {
    const r2 = seedRand(13);
    const out = [];
    for (let i = 0; i < 80 * density; i++) {
      const x = r2() * width;
      const y = r2() * height;
      const w = 18 + r2() * 60;
      const h = 14 + r2() * 50;
      out.push({ x, y, w, h, op: 0.05 + r2() * 0.08 });
    }
    return out;
  }, [width, height, density]);

  const water = "M -20 380 C 150 360, 230 480, 290 520 S 410 540, 480 470 S 540 360, 620 360 L 620 720 L -20 720 Z";

  if (satellite) {
    return (
      <svg className="map-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="satg" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#2a3024"/>
            <stop offset="100%" stopColor="#15170F"/>
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#satg)"/>
        {blocks.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={i % 4 === 0 ? "#3a4028" : i % 3 === 0 ? "#2c3422" : "#252a1c"} opacity={0.5 + b.op * 4}/>
        ))}
        {streets.map((s, i) => <path key={i} d={s.d} stroke="#42453a" strokeWidth={s.w} fill="none"/>)}
      </svg>
    );
  }

  return (
    <svg className="map-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="bgg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#13141A"/>
          <stop offset="100%" stopColor="#0A0A0E"/>
        </radialGradient>
        <pattern id="parcels" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#1A1B22" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#bgg)"/>
      <rect width={width} height={height} fill="url(#parcels)" opacity="0.5"/>
      <path d={water} fill="#0E1828" stroke="#15243A" strokeWidth="1"/>
      <path d={water} fill="none" stroke="#1B2D45" strokeWidth="0.5" opacity="0.6"/>
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={i % 5 === 0 ? "#16171E" : "#13141A"} opacity={b.op}/>
      ))}
      {streets.map((s, i) => (
        <path key={i} d={s.d} stroke={s.c} strokeWidth={s.w} fill="none" strokeLinecap="round"/>
      ))}
      <g fontFamily="Manrope" fill="#3A3D49" fontSize="10" fontWeight="700" letterSpacing="0.05em">
        <text x="50" y="215" transform="rotate(-3 50 215)">I-75</text>
        <text x="160" y="100" transform="rotate(82 160 100)">I-285</text>
        <text x="20" y="595">US-78</text>
        <text x="610" y="80" transform="rotate(82 610 80)">GA-400</text>
      </g>
    </svg>
  );
}
