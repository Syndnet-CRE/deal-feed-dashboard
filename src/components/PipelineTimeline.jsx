import { useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
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
  if (h < 2)  return { nodeIdx: 1, phase: 'Agents Running',     nextH: 2 };
  if (h < 4)  return { nodeIdx: 2, phase: 'Briefs Generating',  nextH: 4 };
  if (h < 6)  return { nodeIdx: 3, phase: 'Deals Delivering',   nextH: 0 };
  return        { nodeIdx: 0, phase: 'Accepting Submissions', nextH: 2 };
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
const NODE_ICONS  = [
  <I.Edit size={18} />,
  <I.Sparkle size={18} />,
  <I.Doc size={18} />,
  <I.Mail size={18} />,
];

const s = {
  cdLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#1DAF29', fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cdClock: {
    display: 'flex', alignItems: 'baseline', gap: 4,
    fontFamily: 'Manrope, system-ui, sans-serif',
    fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.01em',
    fontVariantNumeric: 'tabular-nums', lineHeight: 0.95,
  },
  cdFoot: {
    fontSize: 10, color: '#9DA2B3', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  phasePill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(29,175,41,0.10)', border: '1px solid rgba(29,175,41,0.25)',
    borderRadius: 20, padding: '3px 10px',
  },
  phaseDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#1DAF29',
    flexShrink: 0, display: 'inline-block', animation: 'dotPulse 2s ease-in-out infinite',
  },
  phaseName: {
    fontSize: 11, fontWeight: 600, color: '#1DAF29',
    fontFamily: 'Manrope, system-ui, sans-serif', whiteSpace: 'nowrap',
  },
  trackBg:  { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: -2, height: 4, background: '#40424D', borderRadius: 2 },
  fill:     { position: 'absolute', left: 0, top: '50%', marginTop: -2, height: 4, width: '0%', background: 'linear-gradient(90deg, #1DAF29, #3DE346)', borderRadius: 2, transition: 'width 0.25s linear', animation: 'timelineGlow 2s ease-in-out infinite', overflow: 'hidden' },
  particle: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', animation: 'particleFlow 2s linear infinite' },
  iconWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#40424D' },
  ring:     { position: 'absolute', inset: -5, borderRadius: '50%', border: '2px solid rgba(29,175,41,0.4)', pointerEvents: 'none', animation: 'ringPulse 2s ease-in-out infinite' },
  nodeLabel:{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9DA2B3', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, sans-serif', lineHeight: 1 },
};

// countdown size tokens
const CD = {
  xl:     { num: 44, sep: 28 },
  header: { num: 36, sep: 24 },
  rail:   { num: 28, sep: 20 },
};

export function PipelineTimeline({ mode = 'full', size = 'xl', showLabels = false, showPhase = true } = {}) {
  const phaseRef    = useRef(null);
  const fillRef     = useRef(null);
  const markerRef   = useRef(null);
  const nodeRefs    = useRef([]);
  const ringRefs    = useRef([]);
  const iconRefs    = useRef([]);
  const checkRefs   = useRef([]);
  const cdHRef      = useRef(null);
  const cdMRef      = useRef(null);
  const cdSRef      = useRef(null);
  const prevNodeIdx = useRef(null);

  useEffect(() => {
    function tick() {
      const nowSecs = getCTSeconds();
      const { nodeIdx, phase, nextH } = getStage(nowSecs);
      const pct = getMarkerPct(nowSecs);

      // countdown
      const total = secsUntilCTHour(nextH || 2);
      if (cdHRef.current) cdHRef.current.textContent = pad(Math.floor(total / 3600));
      if (cdMRef.current) cdMRef.current.textContent = pad(Math.floor((total % 3600) / 60));
      if (cdSRef.current) cdSRef.current.textContent = pad(total % 60);

      // phase label
      if (phaseRef.current) phaseRef.current.textContent = phase;

      // track fill + marker
      if (fillRef.current)   fillRef.current.style.width  = `${pct}%`;
      if (markerRef.current) markerRef.current.style.left = `${pct}%`;

      // node state
      nodeRefs.current.forEach((el, i) => {
        if (!el) return;
        const done   = i < nodeIdx;
        const active = i === nodeIdx;
        el.style.background  = done ? '#1DAF29' : '#1E1E24';
        el.style.borderColor = (done || active) ? '#1DAF29' : '#40424D';
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

      // burst on phase flip
      if (prevNodeIdx.current !== null && prevNodeIdx.current !== nodeIdx) {
        const el = nodeRefs.current[nodeIdx];
        if (el) {
          el.classList.add('pipeline-node-burst');
          setTimeout(() => el && el.classList.remove('pipeline-node-burst'), 900);
        }
      }
      prevNodeIdx.current = nodeIdx;
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Renderers ──────────────────────────────────────────────────

  const numSz = CD[size]?.num ?? CD.xl.num;
  const sepSz = CD[size]?.sep ?? CD.xl.sep;

  const renderCountdown = () => (
    <div className="pipeline-cd-panel">
      <div style={s.cdLabel}>
        <Timer size={12} />
        <span>Next Run</span>
      </div>
      <div style={s.cdClock} className="pipeline-cd-clock">
        <span className="pipeline-cd-num" style={{ fontSize: numSz, lineHeight: 0.95 }} ref={cdHRef}>00</span>
        <span style={{ fontSize: sepSz, color: '#40424D', margin: '0 2px', position: 'relative', top: -2 }}>:</span>
        <span className="pipeline-cd-num" style={{ fontSize: numSz, lineHeight: 0.95 }} ref={cdMRef}>00</span>
        <span style={{ fontSize: sepSz, color: '#40424D', margin: '0 2px', position: 'relative', top: -2 }}>:</span>
        <span className="pipeline-cd-num" style={{ fontSize: numSz, lineHeight: 0.95 }} ref={cdSRef}>00</span>
      </div>
      <div style={s.cdFoot}>2:00 AM CT</div>
    </div>
  );

  const renderPhasePill = () => (
    <div style={s.phasePill} className="pipeline-phase-pill">
      <span style={s.phaseDot} />
      <span style={s.phaseName} ref={phaseRef}>Accepting Submissions</span>
    </div>
  );

  const renderTrack = () => {
    // node wrap: when showLabels, anchor top of node to track line, label hangs below
    const nodeWrapStyle = showLabels
      ? { position: 'absolute', top: '50%', transform: 'translateX(-50%)', marginTop: -13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }
      : { position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

    const nodeBoxStyle = {
      width: 26, height: 26, borderRadius: '50%', border: '2px solid #40424D',
      background: '#1E1E24', position: 'relative', zIndex: 3, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    };

    const trackRowStyle = {
      position: 'relative',
      height: showLabels ? 44 : 28,
      marginLeft: 28, marginRight: 28,
      flex: 1,
    };

    const markerStyle = {
      position: 'absolute', top: '50%', left: '0%',
      transform: 'translate(-50%, -50%)', zIndex: 4,
      transition: 'left 0.25s linear',
      animation: 'markerPulse 2s ease-in-out infinite',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    };

    return (
      <div className="pipeline-track-panel" style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        {showPhase && (
          <div style={s.phasePill} className="pipeline-phase-pill">
            <span style={s.phaseDot} />
            <span style={s.phaseName} ref={phaseRef}>Accepting Submissions</span>
          </div>
        )}

        <div style={trackRowStyle}>
          <div style={s.trackBg} />
          <div ref={fillRef} style={s.fill}>
            <div style={s.particle} />
            <div style={{ ...s.particle, animationDelay: '0.6s' }} />
            <div style={{ ...s.particle, animationDelay: '1.2s' }} />
          </div>
          <div ref={markerRef} style={markerStyle}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" fill="#5BCC48" stroke="#40424D" strokeWidth="1.4" />
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
              <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" fill="#5BCC48" stroke="#40424D" strokeWidth="1.4" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" fill="#5BCC48" stroke="#40424D" strokeWidth="1.4" />
            </svg>
          </div>

          {NODE_LABELS.map((label, i) => (
            <div key={label} style={{ ...nodeWrapStyle, left: `${NODE_PCTS[i]}%` }}>
              <div ref={el => { nodeRefs.current[i] = el; }} style={nodeBoxStyle} className="pipeline-node">
                <div ref={el => { ringRefs.current[i] = el; }} style={{ ...s.ring, display: 'none' }} />
                <div ref={el => { iconRefs.current[i] = el; }} style={s.iconWrap}>
                  {NODE_ICONS[i]}
                </div>
                <div ref={el => { checkRefs.current[i] = el; }} style={{ ...s.iconWrap, display: 'none', color: '#ffffff' }}>
                  <I.Check size={14} />
                </div>
              </div>
              {showLabels && <div style={s.nodeLabel}>{label}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Mode routing ───────────────────────────────────────────────

  if (mode === 'phase') {
    return <div className="pipeline-phase-only">{renderPhasePill()}</div>;
  }

  if (mode === 'countdown') {
    return <div className="pipeline-countdown-only">{renderCountdown()}</div>;
  }

  if (mode === 'track') {
    return <div className="pipeline-track-only" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>{renderTrack()}</div>;
  }

  // legacy full grid (not actively used)
  return (
    <div className="pipeline-timeline pipeline-timeline-grid" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {renderCountdown()}
      {renderTrack()}
    </div>
  );
}
