import { useState, useEffect, useRef } from 'react';

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

function getStageInfo() {
  const nowSecs = getCTSeconds();
  const h = Math.floor(nowSecs / 3600);
  if (h < 2)  return { nodeIdx: 1, activeLabel: 'Agents Running Now',    countdownLabel: 'Briefs Writing In',           nextH: 2 };
  if (h < 4)  return { nodeIdx: 2, activeLabel: 'Briefs Generating Now', countdownLabel: 'Deals Hitting Inboxes In',    nextH: 4 };
  if (h < 6)  return { nodeIdx: 3, activeLabel: 'Deals Delivering Now',  countdownLabel: 'Agent Launch In',             nextH: 0 };
  return               { nodeIdx: 0, activeLabel: null,                   countdownLabel: 'Buy Box Submission Closes In', nextH: 0 };
}

function pad(n) { return String(n).padStart(2, '0'); }

function FlipDigit({ value }) {
  const prevRef = useRef(value);
  const [flipping, setFlipping] = useState(false);
  const [displayPrev, setDisplayPrev] = useState(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setDisplayPrev(prevRef.current);
      prevRef.current = value;
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 320);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="fd-wrap" aria-hidden="true">
      <div className="fd-half fd-lower">{value}</div>
      <div className={`fd-half fd-upper${flipping ? ' fd-flip' : ''}`}>
        {flipping ? displayPrev : value}
      </div>
    </div>
  );
}

const NODES = ['Submit', 'Agents', 'Briefs', 'Delivered'];

export function PipelineTimeline() {
  const [info, setInfo] = useState(getStageInfo);
  const [secsLeft, setSecsLeft] = useState(() => secsUntilCTHour(getStageInfo().nextH));

  useEffect(() => {
    const tick = () => {
      const next = getStageInfo();
      setInfo(next);
      setSecsLeft(secsUntilCTHour(next.nextH));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.max(0, secsLeft);
  const hh = pad(Math.floor(total / 3600));
  const mm = pad(Math.floor((total % 3600) / 60));
  const ss = pad(total % 60);
  const { nodeIdx, activeLabel, countdownLabel } = info;

  return (
    <div className="pipeline-timeline">
      <div className="pt-countdown-wrap">
        {activeLabel && <div className="pt-active-badge">{activeLabel}</div>}
        <div
          className="fd-row"
          aria-label={`${hh} hours ${mm} minutes ${ss} seconds`}
        >
          <FlipDigit value={hh[0]} />
          <FlipDigit value={hh[1]} />
          <span className="fd-sep">:</span>
          <FlipDigit value={mm[0]} />
          <FlipDigit value={mm[1]} />
          <span className="fd-sep">:</span>
          <FlipDigit value={ss[0]} />
          <FlipDigit value={ss[1]} />
        </div>
        <div className="pt-countdown-label">{countdownLabel}</div>
      </div>

      <div className="pt-track">
        {NODES.map((label, i) => {
          const done   = i < nodeIdx;
          const active = i === nodeIdx;
          return (
            <div key={label} className="pt-node-cell">
              {i > 0 && <div className={`pt-connector${done || active ? ' pt-connector-filled' : ''}`} />}
              <div className={`pt-dot${done ? ' pt-dot-done' : active ? ' pt-dot-active' : ' pt-dot-future'}`} />
              <div className={`pt-node-label${active ? ' pt-node-label-active' : done ? ' pt-node-label-done' : ''}`}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
