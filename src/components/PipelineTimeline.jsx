import { useEffect, useRef } from 'react';
import { I } from './Icons.jsx';

const TZ = 'America/Chicago';

function getCTSeconds() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
  return get('hour') * 3600 + get('minute') * 60 + get('second');
}

function secsUntilCTHour(targetH) {
  const nowSecs = getCTSeconds();
  const targetSecs = targetH * 3600;
  const delta = targetSecs - nowSecs;
  return delta > 0 ? delta : delta + 86400;
}

function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }

function getStage(nowSecs) {
  const h = Math.floor(nowSecs / 3600);
  if (h < 2)  return { nodeIdx: 1, phase: 'Agents Running Now',                 cdLabel: 'BRIEFS WRITING IN',           nextH: 2 };
  if (h < 4)  return { nodeIdx: 2, phase: 'Briefs Generating Now',              cdLabel: 'DEALS HITTING INBOXES IN',    nextH: 4 };
  if (h < 6)  return { nodeIdx: 3, phase: 'Deals Delivering Now',               cdLabel: 'AGENT LAUNCH IN',             nextH: 0 };
  return               { nodeIdx: 0, phase: 'Dead Zone — Accepting Submissions',  cdLabel: 'BUY BOX SUBMISSION CLOSES IN', nextH: 0 };
}

function getMarkerPct(nowSecs) {
  const h = Math.floor(nowSecs / 3600);
  if (h < 2) return 18 + (nowSecs / 7200) * 32;
  if (h < 4) return 50 + ((nowSecs - 7200) / 7200) * 25;
  if (h < 6) return 75 + ((nowSecs - 14400) / 7200) * 25;
  const sinceSix = nowSecs - 21600;
  return Math.max(0, Math.min(18, (sinceSix / 64800) * 18));
}

const NODE_LABELS = ['Submit', 'Agents', 'Briefs', 'Delivered'];
const NODE_PCTS   = [18, 50, 75, 100];
const NODE_DESCS  = ['Locks at midnight', 'AI scouts criteria', 'Reports assembled', 'Hits your feed'];
const NODE_ICONS  = [
  <I.Edit size={18} />,
  <I.Sparkle size={18} />,
  <I.Doc size={18} />,
  <I.Mail size={18} />,
];

// All styles inline to avoid CSS cascade conflicts with styles.css
const S = {
  // Top row
  topRow:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 },
  cdCol:     { display: 'flex', flexDirection: 'column', gap: 8 },
  cdLabel:   { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9DA2B3', fontFamily: 'Manrope, system-ui, sans-serif' },
  blocksRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  block:     {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: '#0D0D0D', border: '1px solid #40424D', borderTop: '2px solid rgba(29,175,41,0.45)',
    borderRadius: 6, padding: '10px 14px', minWidth: 64,
    position: 'relative', overflow: 'hidden',
  },
  blockNum:  { fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 36, fontWeight: 800, color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 1 },
  blockUnit: { fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9DA2B3', marginTop: 4, position: 'relative', zIndex: 1 },
  shimmer:   { position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(29,175,41,0.08), transparent)', animation: 'shimmerScan 3s ease-in-out infinite', zIndex: 0 },
  colon:     { fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 24, fontWeight: 700, color: '#40424D', lineHeight: 1, alignSelf: 'flex-start', marginTop: 16 },

  // Phase pill (right column)
  phaseCol:  { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', textAlign: 'right', paddingTop: 2 },
  phaseLabel:{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9DA2B3', fontFamily: 'Manrope, system-ui, sans-serif' },
  phasePill: { display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(29,175,41,0.10)', border: '1px solid rgba(29,175,41,0.25)', borderRadius: 20, padding: '5px 12px' },
  phaseDot:  { width: 7, height: 7, borderRadius: '50%', background: '#1DAF29', flexShrink: 0, display: 'inline-block', animation: 'dotPulse 2s ease-in-out infinite' },
  phaseName: { fontSize: 12, fontWeight: 600, color: '#1DAF29', fontFamily: 'Manrope, system-ui, sans-serif', whiteSpace: 'nowrap' },

  // Track row — nodeWrap.top=8, node height=44 → node center y=30, track center y=30
  trackRow:  { position: 'relative', height: 100, marginLeft: 100, marginRight: 100 },
  trackBg:   { position: 'absolute', left: 0, right: 0, top: 27, height: 6, background: '#40424D', borderRadius: 3 },
  fill:      { position: 'absolute', left: 0, top: 27, height: 6, width: '0%', background: 'linear-gradient(90deg, #1DAF29, #3DE346)', borderRadius: 3, transition: 'width 0.25s linear', animation: 'timelineGlow 2s ease-in-out infinite', overflow: 'hidden' },
  particle:  { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', animation: 'particleFlow 2s linear infinite' },
  marker:    { position: 'absolute', top: 8, left: '0%', transform: 'translateX(-50%)', zIndex: 4, transition: 'left 0.25s linear', animation: 'markerPulse 2s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Nodes
  nodeWrap:     { position: 'absolute', top: 16, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  node:         { width: 29, height: 29, borderRadius: '50%', border: '2px solid #40424D', background: '#1E1E24', position: 'relative', zIndex: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconWrap:     { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#40424D' },
  ring:         { position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(29,175,41,0.4)', pointerEvents: 'none', animation: 'ringPulse 2s ease-in-out infinite' },
  nodeLabelWrap:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  nodeLabel:    { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9DA2B3', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, sans-serif', lineHeight: 1 },
  nodeDesc:     { fontSize: 9, color: '#6B7280', textAlign: 'center', lineHeight: 1.3, maxWidth: 72, fontFamily: 'Manrope, system-ui, sans-serif' },
};

export function PipelineTimeline() {
  const hRef       = useRef(null);
  const mRef       = useRef(null);
  const sRef       = useRef(null);
  const cdLabelRef = useRef(null);
  const phaseRef   = useRef(null);
  const fillRef    = useRef(null);
  const markerRef  = useRef(null);
  const nodeRefs   = useRef([]);
  const ringRefs   = useRef([]);
  const iconRefs   = useRef([]);
  const checkRefs  = useRef([]);

  useEffect(() => {
    function tick() {
      const nowSecs = getCTSeconds();
      const { nodeIdx, phase, cdLabel, nextH } = getStage(nowSecs);
      const total = secsUntilCTHour(nextH);
      const hh = pad(Math.floor(total / 3600));
      const mm = pad(Math.floor((total % 3600) / 60));
      const ss = pad(total % 60);
      const pct = getMarkerPct(nowSecs);

      if (hRef.current)       hRef.current.textContent       = hh;
      if (mRef.current)       mRef.current.textContent       = mm;
      if (sRef.current)       sRef.current.textContent       = ss;
      if (cdLabelRef.current) cdLabelRef.current.textContent = cdLabel;
      if (phaseRef.current)   phaseRef.current.textContent   = phase;

      if (fillRef.current)   fillRef.current.style.width  = `${pct}%`;
      if (markerRef.current) markerRef.current.style.left = `${pct}%`;

      nodeRefs.current.forEach((el, i) => {
        if (!el) return;
        const done   = i < nodeIdx;
        const active = i === nodeIdx;
        if (done) {
          el.style.background  = '#1DAF29';
          el.style.borderColor = '#1DAF29';
        } else if (active) {
          el.style.background  = '#1E1E24';
          el.style.borderColor = '#1DAF29';
        } else {
          el.style.background  = '#1E1E24';
          el.style.borderColor = '#40424D';
        }
        if (iconRefs.current[i]) {
          iconRefs.current[i].style.display = done ? 'none' : 'flex';
          iconRefs.current[i].style.color   = active ? '#1DAF29' : '#40424D';
        }
        if (checkRefs.current[i]) {
          checkRefs.current[i].style.display = done ? 'flex' : 'none';
        }
      });

      ringRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.display = (i === nodeIdx) ? 'block' : 'none';
      });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pipeline-timeline">

      {/* TOP ROW */}
      <div style={S.topRow}>

        {/* LEFT: countdown */}
        <div style={S.cdCol}>
          <div style={S.cdLabel} ref={cdLabelRef}>BUY BOX SUBMISSION CLOSES IN</div>
          <div style={S.blocksRow}>
            <div style={S.block}>
              <span style={S.shimmer} />
              <span style={S.blockNum} ref={hRef}>00</span>
              <span style={S.blockUnit}>HRS</span>
            </div>
            <span style={S.colon}>:</span>
            <div style={S.block}>
              <span style={{ ...S.shimmer, animationDelay: '1s' }} />
              <span style={S.blockNum} ref={mRef}>00</span>
              <span style={S.blockUnit}>MIN</span>
            </div>
            <span style={S.colon}>:</span>
            <div style={S.block}>
              <span style={{ ...S.shimmer, animationDelay: '2s' }} />
              <span style={S.blockNum} ref={sRef}>00</span>
              <span style={S.blockUnit}>SEC</span>
            </div>
          </div>
        </div>

        {/* RIGHT: current phase pill */}
        <div style={S.phaseCol}>
          <span style={S.phaseLabel}>CURRENT PHASE</span>
          <div style={S.phasePill}>
            <span style={S.phaseDot} />
            <span style={S.phaseName} ref={phaseRef}>Dead Zone — Accepting Submissions</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: animated track */}
      <div style={S.trackRow}>
        <div style={S.trackBg} />
        <div ref={fillRef} style={S.fill}>
          <div style={S.particle} />
          <div style={{ ...S.particle, animationDelay: '0.6s' }} />
          <div style={{ ...S.particle, animationDelay: '1.2s' }} />
        </div>
        <div ref={markerRef} style={S.marker}>
          <svg width={44} height={44} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
            {/* Right fin */}
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" fill="#5BCC48" stroke="#1DAF29" strokeWidth="1.5" />
            {/* Flame — fire color */}
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
            {/* Main body */}
            <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" fill="#5BCC48" stroke="#1DAF29" strokeWidth="1.5" />
            {/* Left fin */}
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" fill="#5BCC48" stroke="#1DAF29" strokeWidth="1.5" />
          </svg>
        </div>
        {NODE_LABELS.map((label, i) => (
          <div key={label} style={{ ...S.nodeWrap, left: `${NODE_PCTS[i]}%` }}>
            <div ref={el => { nodeRefs.current[i] = el; }} style={S.node}>
              <div
                ref={el => { ringRefs.current[i] = el; }}
                style={{ ...S.ring, display: 'none' }}
              />
              <div ref={el => { iconRefs.current[i] = el; }} style={S.iconWrap}>
                {NODE_ICONS[i]}
              </div>
              <div ref={el => { checkRefs.current[i] = el; }} style={{ ...S.iconWrap, display: 'none', color: '#ffffff' }}>
                <I.Check size={16} />
              </div>
            </div>
            <div style={S.nodeLabelWrap}>
              <div style={S.nodeLabel}>{label}</div>
              <div style={S.nodeDesc}>{NODE_DESCS[i]}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
