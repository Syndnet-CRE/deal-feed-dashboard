import { useEffect, useRef } from 'react';

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
  if (h < 2)  return { nodeIdx: 1, phase: 'Agents Running Now',                cdLabel: 'BRIEFS WRITING IN',           nextH: 2 };
  if (h < 4)  return { nodeIdx: 2, phase: 'Briefs Generating Now',             cdLabel: 'DEALS HITTING INBOXES IN',    nextH: 4 };
  if (h < 6)  return { nodeIdx: 3, phase: 'Deals Delivering Now',              cdLabel: 'AGENT LAUNCH IN',             nextH: 0 };
  return               { nodeIdx: 0, phase: 'Dead Zone — Accepting Submissions', cdLabel: 'BUY BOX SUBMISSION CLOSES IN', nextH: 0 };
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

// Track geometry — all values in px, relative to .pt2-track-row
const TRACK_TOP    = 14; // center of 28px nodes: 0 + 14 = 14
const TRACK_H      = 4;
const TRACK_OFFSET = TRACK_TOP - TRACK_H / 2; // top of the 4px bar = 12px
const MARKER_SIZE  = 16;
const MARKER_TOP   = TRACK_TOP - MARKER_SIZE / 2; // 14 - 8 = 6px

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

      {/* TOP ROW: countdown left, phase right */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>

        {/* Countdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="pt2-cd-label" ref={cdLabelRef}>BUY BOX SUBMISSION CLOSES IN</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div className="pt2-block">
              <span className="pt2-block-num" ref={hRef}>00</span>
              <span className="pt2-block-unit">HRS</span>
            </div>
            <span className="pt2-colon">:</span>
            <div className="pt2-block">
              <span className="pt2-block-num" ref={mRef}>00</span>
              <span className="pt2-block-unit">MIN</span>
            </div>
            <span className="pt2-colon">:</span>
            <div className="pt2-block">
              <span className="pt2-block-num" ref={sRef}>00</span>
              <span className="pt2-block-unit">SEC</span>
            </div>
          </div>
        </div>

        {/* Current phase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', textAlign: 'right', paddingTop: 2 }}>
          <span className="pt2-phase-label">CURRENT PHASE</span>
          <span className="pt2-phase-name" ref={phaseRef}>Dead Zone — Accepting Submissions</span>
        </div>
      </div>

      {/* BOTTOM ROW: animated track bar with 4 nodes */}
      <div style={{ position: 'relative', height: 60 }}>

        {/* Track background */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: TRACK_OFFSET, height: TRACK_H,
          background: '#40424D', borderRadius: 2,
        }} />

        {/* Green fill — same position as track-bg, width animated */}
        <div ref={fillRef} style={{
          position: 'absolute', left: 0,
          top: TRACK_OFFSET, height: TRACK_H,
          width: '0%',
          background: '#1DAF29', borderRadius: 2,
          transition: 'width 0.25s linear',
          animation: 'timelineGlow 2s ease-in-out infinite',
        }} />

        {/* Live position marker */}
        <div ref={markerRef} style={{
          position: 'absolute',
          top: MARKER_TOP, left: '0%',
          transform: 'translateX(-50%)',
          width: MARKER_SIZE, height: MARKER_SIZE,
          borderRadius: '50%',
          background: '#1DAF29',
          boxShadow: '0 0 0 4px rgba(29,175,41,0.2)',
          zIndex: 4,
          transition: 'left 0.25s linear',
          animation: 'markerPulse 2s ease-in-out infinite',
        }} />

        {/* Stage nodes */}
        {NODE_LABELS.map((label, i) => (
          <div key={label} style={{
            position: 'absolute',
            left: `${NODE_PCTS[i]}%`,
            top: 0,
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div
              ref={el => { nodeRefs.current[i] = el; }}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2px solid #40424D',
                background: '#1E1E24',
                position: 'relative', zIndex: 3,
                flexShrink: 0,
              }}
            >
              <div
                ref={el => { ringRefs.current[i] = el; }}
                style={{
                  display: 'none',
                  position: 'absolute', inset: -6,
                  borderRadius: '50%',
                  border: '2px solid rgba(29,175,41,0.4)',
                  pointerEvents: 'none',
                  animation: 'ringPulse 2s ease-in-out infinite',
                }}
              />
            </div>
            <div style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#9DA2B3', whiteSpace: 'nowrap',
            }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
