import { useState, useEffect, useRef } from 'react';

function pad2(n) { return String(n).padStart(2, '0'); }

export function BuyBoxRightRail({ matchCount, filters }) {
  const [clock, setClock] = useState(() => {
    const now = new Date();
    return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  });
  const [pulse, setPulse] = useState(false);
  const [prevCount, setPrevCount] = useState(matchCount);
  const [delta, setDelta] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setClock(`${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (matchCount === prevCount) return;
    setDelta(matchCount - prevCount);
    setPulse(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPulse(false);
      setPrevCount(matchCount);
    }, 600);
  }, [matchCount, prevCount]);

  return (
    <aside className="rail">
      <div className="rail-inner">
        <div className="rail-head">
          <div className="rail-status">
            <div className="rail-status-dot" />
            Live
          </div>
          <div className="rail-tick">{clock}</div>
        </div>

        <div className="quote-block">
          <div className="quote-label">Live match pool</div>
          <div className={`quote-value${pulse ? ' recalc' : ''}`}>
            {matchCount.toLocaleString('en-US')}
          </div>
          {delta !== 0 && (
            <div className="quote-delta">
              <span className={`quote-delta-val ${delta > 0 ? 'pos' : 'neg'}`}>
                {delta > 0 ? '+' : ''}{delta.toLocaleString('en-US')}
              </span>
              <span>vs. prev</span>
            </div>
          )}
          <div className="quote-sub">properties matched to criteria</div>
        </div>

        <div className="stat-trio">
          <div className="stat-cell">
            <div className="stat-cell-label">Avg equity</div>
            <div className="stat-cell-value">$184K</div>
            <div className="stat-cell-spark pos">↑ 2.1%</div>
          </div>
          <div className="stat-cell">
            <div className="stat-cell-label">Hold</div>
            <div className="stat-cell-value">11.3yr</div>
            <div className="stat-cell-spark">avg</div>
          </div>
          <div className="stat-cell">
            <div className="stat-cell-label">Absentee</div>
            <div className="stat-cell-value">47%</div>
            <div className="stat-cell-spark">of pool</div>
          </div>
        </div>

        {filters.length > 0 && (
          <div>
            <div className="quote-label" style={{ marginBottom: 10 }}>Active filters</div>
            <div className="filter-chips">
              {filters.map((f, i) => (
                <span key={i} className="f-chip">
                  {f.label && <span className="label">{f.label}</span>}
                  <span className="val">{f.val}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
