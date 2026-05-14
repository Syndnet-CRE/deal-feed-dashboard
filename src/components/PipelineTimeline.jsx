import { useEffect, useRef, useState } from 'react';
import { Timer } from 'lucide-react';
import PipelineTrack from './PipelineTrack.jsx';
import { useDeals } from '../contexts/DealsContext';

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
  // Gates are evenly spaced: Submit=0%, Agents=33.33%, Briefs=66.67%, Delivered=100%
  // Pipeline windows: midnight→2am, 2am→4am, 4am→6am. Idle outside those hours → 0%.
  const THIRD = 100 / 3;
  const h = Math.floor(nowSecs / 3600);
  if (h < 2) return (nowSecs / 7200) * THIRD;
  if (h < 4) return THIRD + ((nowSecs - 7200)  / 7200) * THIRD;
  if (h < 6) return 2 * THIRD + ((nowSecs - 14400) / 7200) * THIRD;
  return 0;
}

function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

// countdown size tokens
const CD = {
  xl:     { num: 44, sep: 28 },
  header: { num: 28, sep: 18 },
  rail:   { num: 28, sep: 20 },
};

export function PipelineTimeline({ mode = 'full', size = 'xl', showLabels = false, showPhase = true } = {}) {
  const theme      = useTheme();
  const isLight    = theme === 'light';
  const { deals = [], buyBoxes = [] } = useDeals() || {};

  const cdHRef     = useRef(null);
  const cdMRef     = useRef(null);
  const cdSRef     = useRef(null);

  const [trackProgress, setTrackProgress] = useState(
    () => getMarkerPct(getCTSeconds()) / 100
  );

  // ── Theme-aware countdown style tokens ─────────────────────────
  const s = {
    cdLabel: {
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
      color: isLight ? '#0D0D0D' : '#FFFFFF', fontFamily: 'Manrope, system-ui, sans-serif',
    },
    cdClock: {
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Manrope, system-ui, sans-serif',
      fontWeight: 800, color: isLight ? '#0D0D0D' : '#FFFFFF', letterSpacing: '0.01em',
      fontVariantNumeric: 'tabular-nums', lineHeight: 0.95,
    },
    cdFoot: {
      fontSize: 10, color: isLight ? '#40424D' : '#9DA2B3', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      fontFamily: 'Manrope, system-ui, sans-serif',
    },
  };

  useEffect(() => {
    function tick() {
      const nowSecs = getCTSeconds();
      const { nextH } = getStage(nowSecs);
      const pct = getMarkerPct(nowSecs);

      // countdown clock (DOM refs — avoids re-render)
      const total = secsUntilCTHour(nextH || 2);
      if (cdHRef.current) cdHRef.current.textContent = pad(Math.floor(total / 3600));
      if (cdMRef.current) cdMRef.current.textContent = pad(Math.floor((total % 3600) / 60));
      if (cdSRef.current) cdSRef.current.textContent = pad(total % 60);

      // track progress (drives PipelineTrack re-render)
      setTrackProgress(pct / 100);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Renderers ──────────────────────────────────────────────────

  const numSz = CD[size]?.num ?? CD.xl.num;
  const sepSz = CD[size]?.sep ?? CD.xl.sep;
  const sepColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.45)';

  const renderCountdown = () => (
    <div className="pipeline-cd-panel">
      <div className="pipeline-cd-container">
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={s.cdLabel}>NEXT</span>
            <span style={s.cdLabel}>RUN</span>
          </div>
          <Timer size={13} color="#1DAF29" />
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(91,204,72,0.18)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <div style={s.cdClock} className="pipeline-cd-clock">
            <span className="pipeline-cd-num" style={{ fontSize: numSz, lineHeight: 0.95 }} ref={cdHRef}>00</span>
            <span style={{ fontSize: sepSz, color: sepColor, margin: '0 1px', position: 'relative', top: -2 }}>:</span>
            <span className="pipeline-cd-num" style={{ fontSize: numSz, lineHeight: 0.95 }} ref={cdMRef}>00</span>
            <span style={{ fontSize: sepSz, color: sepColor, margin: '0 1px', position: 'relative', top: -2 }}>:</span>
            <span className="pipeline-cd-num" style={{ fontSize: numSz, lineHeight: 0.95, color: '#1DAF29' }} ref={cdSRef}>00</span>
          </div>
          <div style={s.cdFoot}>2:00 AM CT</div>
        </div>
      </div>
    </div>
  );

  // ── Mode routing ───────────────────────────────────────────────

  if (mode === 'countdown') {
    return <div className="pipeline-countdown-only">{renderCountdown()}</div>;
  }

  if (mode === 'track') {
    const { nodeIdx } = getStage(getCTSeconds());
    const eta = ['02:00 CT', '02:00 CT', '04:00 CT', '06:00 CT'][nodeIdx] || '02:00 CT';
    const activeBoxes = buyBoxes.filter(b => b.status === 'Active').length;
    const queueCount  = deals.length;
    return (
      <div className="pipeline-track-only" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <PipelineTrack
          progress={trackProgress}
          activeIndexOverride={nodeIdx}
          telemetry={{
            boxes:    activeBoxes,
            queue:    queueCount,
            capacity: Math.round(trackProgress * 100),
            briefs:   0,
            eta,
          }}
        />
      </div>
    );
  }

  // legacy full grid (not actively used)
  return (
    <div className="pipeline-timeline pipeline-timeline-grid" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {renderCountdown()}
      <div className="pipeline-track-only" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <PipelineTrack
          progress={trackProgress}
          telemetry={{ boxes: 1, queue: 21, capacity: Math.round(trackProgress * 100), briefs: 0, eta: '02:00 CT' }}
        />
      </div>
    </div>
  );
}
