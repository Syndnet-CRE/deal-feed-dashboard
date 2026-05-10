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
  if (h < 2)  return { nodeIdx: 1, phase: 'Agents Running Now',                nextH: 2 };
  if (h < 4)  return { nodeIdx: 2, phase: 'Briefs Generating Now',             nextH: 4 };
  if (h < 6)  return { nodeIdx: 3, phase: 'Deals Delivering Now',              nextH: 0 };
  return        { nodeIdx: 0, phase: 'Dead Zone — Accepting Submissions',      nextH: 2 };
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
  <I.Edit size={14} />,
  <I.Sparkle size={14} />,
  <I.Doc size={14} />,
  <I.Mail size={14} />,
];

const baseStyles = {
  cdLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#1DAF29',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cdClock: {
    display: 'flex', alignItems: 'baseline', gap: 4,
    fontFamily: 'Manrope, system-ui, sans-serif',
    fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.01em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 0.95,
  },
  cdFoot: { fontSize: 10, color: '#9DA2B3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'Manrope, system-ui, sans-serif' },
  phaseLabel: { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9DA2B3', fontFamily: 'Manrope, system-ui, sans-serif' },
  phasePill: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(29,175,41,0.10)', border: '1px solid rgba(29,175,41,0.25)', borderRadius: 20, padding: '3px 10px' },
  phaseDot:  { width: 6, height: 6, borderRadius: '50%', background: '#1DAF29', flexShrink: 0, display: 'inline-block', animation: 'dotPulse 2s ease-in-out infinite' },
  phaseName: { fontSize: 11, fontWeight: 600, color: '#1DAF29', fontFamily: 'Manrope, system-ui, sans-serif', whiteSpace: 'nowrap' },
  trackBg:   { position: 'absolute', left: 0, right: 0, top: 14, height: 4, background: '#40424D', borderRadius: 2 },
  fill:      { position: 'absolute', left: 0, top: 14, height: 4, width: '0%', background: 'linear-gradient(90deg, #1DAF29, #3DE346)', borderRadius: 2, transition: 'width 0.25s linear', animation: 'timelineGlow 2s ease-in-out infinite', overflow: 'hidden' },
  particle:  { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', animation: 'particleFlow 2s linear infinite' },
  marker:    { position: 'absolute', top: -2, left: '0%', transform: 'translateX(-50%)', zIndex: 4, transition: 'left 0.25s linear', animation: 'markerPulse 2s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nodeWrap:  { position: 'absolute', top: 6, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  node:      { width: 22, height: 22, borderRadius: '50%', border: '2px solid #40424D', background: '#1E1E24', position: 'relative', zIndex: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconWrap:  { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#40424D' },
  ring:      { position: 'absolute', inset: -5, borderRadius: '50%', border: '2px solid rgba(29,175,41,0.4)', pointerEvents: 'none', animation: 'ringPulse 2s ease-in-out infinite' },
  nodeLabel: { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9DA2B3', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, sans-serif', lineHeight: 1 },
};

const fullStyles = {
  cdPanel: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
    paddingRight: 20,
    borderRight: '1px solid rgba(91,204,72,0.18)',
  },
  cdNum: { fontSize: 44, lineHeight: 0.95 },
  cdSep: { fontSize: 28, color: '#40424D', margin: '0 2px', position: 'relative', top: -3 },
  trackPanel: { display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 20 },
  phaseRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8 },
  trackRow:  { position: 'relative', height: 64, marginLeft: 50, marginRight: 50 },
};

const railStyles = {
  cdPanel: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
    padding: '6px 2px',
  },
  cdNum: { fontSize: 28, lineHeight: 0.95 },
  cdSep: { fontSize: 20, color: '#40424D', margin: '0 1px', position: 'relative', top: -2 },
};

const compactStyles = {
  trackPanel: { display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 0, flex: 1 },
  trackRow:   { position: 'relative', height: 28, marginLeft: 28, marginRight: 28, flex: 1 },
  phasePill:  { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(29,175,41,0.10)', border: '1px solid rgba(29,175,41,0.25)', borderRadius: 20, padding: '3px 10px', flexShrink: 0 },
  trackBg:    { position: 'absolute', left: 0, right: 0, top: '50%', marginTop: -2, height: 4, background: '#40424D', borderRadius: 2 },
  fill:       { position: 'absolute', left: 0, top: '50%', marginTop: -2, height: 4, width: '0%', background: 'linear-gradient(90deg, #1DAF29, #3DE346)', borderRadius: 2, transition: 'width 0.25s linear', animation: 'timelineGlow 2s ease-in-out infinite', overflow: 'hidden' },
  marker:     { position: 'absolute', top: '50%', left: '0%', transform: 'translate(-50%, -50%)', zIndex: 4, transition: 'left 0.25s linear', animation: 'markerPulse 2s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nodeWrap:   { position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  node:       { width: 18, height: 18, borderRadius: '50%', border: '2px solid #40424D', background: '#1E1E24', position: 'relative', zIndex: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export function PipelineTimeline({ mode = 'full', size = 'xl', compact = false } = {}) {
  const phaseRef   = useRef(null);
  const fillRef    = useRef(null);
  const markerRef  = useRef(null);
  const nodeRefs   = useRef([]);
  const ringRefs   = useRef([]);
  const iconRefs   = useRef([]);
  const checkRefs  = useRef([]);
  const cdHRef     = useRef(null);
  const cdMRef     = useRef(null);
  const cdSRef     = useRef(null);

  useEffect(() => {
    function tick() {
      const nowSecs = getCTSeconds();
      const { nodeIdx, phase, nextH } = getStage(nowSecs);
      const pct = getMarkerPct(nowSecs);

      const total = secsUntilCTHour(nextH || 2);
      const hh = pad(Math.floor(total / 3600));
      const mm = pad(Math.floor((total % 3600) / 60));
      const ss = pad(total % 60);
      if (cdHRef.current) cdHRef.current.textContent = hh;
      if (cdMRef.current) cdMRef.current.textContent = mm;
      if (cdSRef.current) cdSRef.current.textContent = ss;

      if (phaseRef.current)  phaseRef.current.textContent  = phase;
      if (fillRef.current)   fillRef.current.style.width   = `${pct}%`;
      if (markerRef.current) markerRef.current.style.left  = `${pct}%`;

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

  const sized = size === 'rail' ? railStyles : fullStyles;
  const cdPanelStyle = mode === 'countdown' ? railStyles.cdPanel : fullStyles.cdPanel;
  const cdNumStyle   = size === 'rail' ? railStyles.cdNum : fullStyles.cdNum;
  const cdSepStyle   = size === 'rail' ? railStyles.cdSep : fullStyles.cdSep;

  const renderCountdown = () => (
    <div style={cdPanelStyle} className={`pipeline-cd-panel pipeline-cd-${mode === 'countdown' ? 'rail' : 'xl'}`}>
      <div style={baseStyles.cdLabel}>
        <Timer size={12} />
        <span>Next Run</span>
      </div>
      <div style={baseStyles.cdClock} className="pipeline-cd-clock">
        <span className="pipeline-cd-num" style={cdNumStyle} ref={cdHRef}>00</span>
        <span className="pipeline-cd-sep" style={cdSepStyle}>:</span>
        <span className="pipeline-cd-num" style={cdNumStyle} ref={cdMRef}>00</span>
        <span className="pipeline-cd-sep" style={cdSepStyle}>:</span>
        <span className="pipeline-cd-num" style={cdNumStyle} ref={cdSRef}>00</span>
      </div>
      <div style={baseStyles.cdFoot}>2:00 AM CT</div>
    </div>
  );

  const trackPanelStyle = compact ? compactStyles.trackPanel : fullStyles.trackPanel;
  const trackRowStyle   = compact ? compactStyles.trackRow   : fullStyles.trackRow;
  const trackBgStyle    = compact ? compactStyles.trackBg    : baseStyles.trackBg;
  const fillStyle       = compact ? compactStyles.fill       : baseStyles.fill;
  const markerStyle     = compact ? compactStyles.marker     : baseStyles.marker;
  const nodeWrapBase    = compact ? compactStyles.nodeWrap   : baseStyles.nodeWrap;
  const nodeBoxStyle    = compact ? compactStyles.node       : baseStyles.node;

  const renderTrack = () => (
    <div style={trackPanelStyle} className={`pipeline-track-panel${compact ? ' pipeline-track-compact' : ''}`}>
      {!compact && (
        <div style={fullStyles.phaseRow}>
          <span style={baseStyles.phaseLabel}>Tonight&apos;s Pipeline</span>
          <div style={baseStyles.phasePill}>
            <span style={baseStyles.phaseDot} />
            <span style={baseStyles.phaseName} ref={phaseRef}>Dead Zone — Accepting Submissions</span>
          </div>
        </div>
      )}

      <div style={trackRowStyle}>
        <div style={trackBgStyle} />
        <div ref={fillRef} style={fillStyle}>
          <div style={baseStyles.particle} />
          <div style={{ ...baseStyles.particle, animationDelay: '0.6s' }} />
          <div style={{ ...baseStyles.particle, animationDelay: '1.2s' }} />
        </div>
        <div ref={markerRef} style={markerStyle}>
          <svg width={compact ? 26 : 36} height={compact ? 26 : 36} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" fill="#5BCC48" stroke="#40424D" strokeWidth="1.4" />
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" fill="#5BCC48" stroke="#40424D" strokeWidth="1.4" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" fill="#5BCC48" stroke="#40424D" strokeWidth="1.4" />
          </svg>
        </div>
        {NODE_LABELS.map((label, i) => (
          <div key={label} style={{ ...nodeWrapBase, left: `${NODE_PCTS[i]}%` }}>
            <div ref={el => { nodeRefs.current[i] = el; }} style={nodeBoxStyle}>
              <div ref={el => { ringRefs.current[i] = el; }} style={{ ...baseStyles.ring, display: 'none' }} />
              <div ref={el => { iconRefs.current[i] = el; }} style={baseStyles.iconWrap}>
                {NODE_ICONS[i]}
              </div>
              <div ref={el => { checkRefs.current[i] = el; }} style={{ ...baseStyles.iconWrap, display: 'none', color: '#ffffff' }}>
                <I.Check size={12} />
              </div>
            </div>
            {!compact && <div style={baseStyles.nodeLabel}>{label}</div>}
          </div>
        ))}
      </div>

      {compact && (
        <div style={compactStyles.phasePill}>
          <span style={baseStyles.phaseDot} />
          <span style={baseStyles.phaseName} ref={phaseRef}>Dead Zone — Accepting Submissions</span>
        </div>
      )}
    </div>
  );

  if (mode === 'countdown') {
    return <div className="pipeline-countdown-only">{renderCountdown()}</div>;
  }

  if (mode === 'track') {
    return <div className={`pipeline-track-only${compact ? ' pipeline-track-only-compact' : ''}`}>{renderTrack()}</div>;
  }

  // legacy: full grid (not used after this change but preserved for safety)
  void sized;
  return (
    <div className="pipeline-timeline pipeline-timeline-grid">
      {renderCountdown()}
      {renderTrack()}
    </div>
  );
}
