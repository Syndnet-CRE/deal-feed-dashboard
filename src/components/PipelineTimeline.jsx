import { useState, useEffect } from 'react';

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
  if (h < 2)  return { nodeIdx: 1, activeLabel: 'Agents Running Now',   countdownLabel: 'Briefs Writing In',          nextH: 2 };
  if (h < 4)  return { nodeIdx: 2, activeLabel: 'Briefs Generating Now', countdownLabel: 'Deals Hitting Inboxes In',   nextH: 4 };
  if (h < 6)  return { nodeIdx: 3, activeLabel: 'Deals Delivering Now',  countdownLabel: 'Agent Launch In',            nextH: 0 };
  return               { nodeIdx: 0, activeLabel: null,                   countdownLabel: 'Buy Box Submission Closes In', nextH: 0 };
}

function pad(n) { return String(n).padStart(2, '0'); }

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
        <div className="pt-digits" aria-label={`${hh} hours ${mm} minutes ${ss} seconds`}>
          <span className="pt-digit-group">{hh}</span>
          <span className="pt-sep">:</span>
          <span className="pt-digit-group">{mm}</span>
          <span className="pt-sep">:</span>
          <span className="pt-digit-group">{ss}</span>
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
