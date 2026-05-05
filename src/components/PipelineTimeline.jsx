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
          el.style.background   = '#1DAF29';
          el.style.borderColor  = '#1DAF29';
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
      <div className="pt2-top">
        <div className="pt2-countdown">
          <div className="pt2-cd-label" ref={cdLabelRef}>BUY BOX SUBMISSION CLOSES IN</div>
          <div className="pt2-blocks">
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
        <div className="pt2-phase">
          <span className="pt2-phase-label">CURRENT PHASE</span>
          <span className="pt2-phase-name" ref={phaseRef}>Dead Zone — Accepting Submissions</span>
        </div>
      </div>

      <div className="pt2-track-row">
        <div className="pt2-track-bg" />
        <div className="pt2-fill" ref={fillRef} />
        <div className="pt2-marker" ref={markerRef}>›</div>
        <div className="pt2-nodes">
          {NODE_LABELS.map((label, i) => (
            <div
              key={label}
              className="pt2-node-wrap"
              style={{ left: `${NODE_PCTS[i]}%` }}
            >
              <div
                className="pt2-node"
                ref={el => { nodeRefs.current[i] = el; }}
              >
                <div
                  className="pt2-ring"
                  ref={el => { ringRefs.current[i] = el; }}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="pt2-node-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
