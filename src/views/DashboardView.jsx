import { useState, useMemo } from 'react';
import { Star, Flame, Mail, Inbox } from 'lucide-react';
import { useDeals } from '../contexts/DealsContext';
import FeedDealCard from '../components/feed/FeedDealCard';
import ChatFab from '../components/feed/ChatFab';
import RightRail from '../components/RightRail';
import LeftRail from '../components/LeftRail';
import WeekDayTabs from '../components/feed/WeekDayTabs';

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinLastWeek(deal) {
  const ts = deal.sentAt || deal.created_at;
  if (!ts) return false;
  const t = new Date(ts).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export function DashboardView({ kpis, searchQuery, filter = 'all', setFilter = () => {} }) {
  const { deals, loading } = useDeals();
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const filteredDeals = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return deals
      .filter(d => !hiddenIds.has(d.id))
      .filter(d => {
        if (filter === 'unread') return !d.is_read;
        if (filter === 'saved')  return !!d.saved;
        if (filter === 'hot')    return d.feedback === 'hot' || (d.score || d.match_score || 0) >= 8;
        if (filter === 'new_this_week') return isWithinLastWeek(d);
        return true;
      })
      .filter(d => {
        if (!q) return true;
        const addr = (d.addr || d.address || '').toLowerCase();
        const asset = (d.asset_class || d.asset || '').toLowerCase();
        return addr.includes(q) || asset.includes(q);
      })
      .filter(d => {
        if (!selectedDay) return true;
        if (!d.sentAt) return false;
        return sameDay(new Date(d.sentAt), selectedDay);
      });
  }, [deals, hiddenIds, searchQuery, filter, selectedDay]);

  function handleHide(id) {
    setHiddenIds(prev => new Set([...prev, id]));
  }

  const counts = useMemo(() => ({
    all:    deals.filter(d => !hiddenIds.has(d.id)).length,
    unread: deals.filter(d => !hiddenIds.has(d.id) && !d.is_read).length,
    saved:  deals.filter(d => !hiddenIds.has(d.id) && d.saved).length,
    hot:    deals.filter(d => !hiddenIds.has(d.id) && (d.feedback === 'hot' || (d.score || d.match_score || 0) >= 8)).length,
  }), [deals, hiddenIds]);

  return (
    <div className="feed-layout">
      <div className="feed-scroll-area">
        <div className="feed-content-row">
          <LeftRail
            filter={filter}
            setFilter={setFilter}
            counts={counts}
            kpis={kpis}
          />

          <div className="feed-center-col">
            <WeekDayTabs
              deals={deals}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            <div className="feed-center" id="feed-scroll">
              {loading ? (
                <div className="feed-loading">Loading your deals…</div>
              ) : (
                <>
                  {filteredDeals.length === 0 && (
                    <div className="feed-empty-state">
                      <div className="feed-empty-icon">
                        {filter === 'saved' ? <Star size={28} /> :
                         filter === 'hot'   ? <Flame size={28} /> :
                         filter === 'unread'? <Mail size={28} /> :
                                              <Inbox size={28} />}
                      </div>
                      <div className="feed-empty-title">
                        {searchQuery
                          ? 'No deals match your search'
                          : filter === 'saved' ? 'No saved deals yet'
                          : filter === 'hot'   ? 'Nothing scorching tonight'
                          : filter === 'unread'? "You're all caught up"
                          : 'No deals yet'}
                      </div>
                      <div className="feed-empty-sub">
                        {searchQuery
                          ? 'Try a different address or asset class.'
                          : filter === 'saved' ? 'Tap the star on any deal to save it here.'
                          : filter === 'hot'   ? 'Hot deals score 8+ or get a thumbs up.'
                          : filter === 'unread'? 'New deals will appear here after tonight’s 2 AM run.'
                          : 'Your first batch arrives at 2 AM CT. Set up a buy box if you haven’t already.'}
                      </div>
                    </div>
                  )}

                  {filteredDeals.map(deal => (
                    <FeedDealCard
                      key={deal.id}
                      deal={deal}
                      onHide={handleHide}
                    />
                  ))}
                </>
              )}
            </div>

          </div>

          <RightRail
            deals={filteredDeals}
            selectedDealId={selectedDealId}
            onSelectDeal={id => setSelectedDealId(id === selectedDealId ? null : id)}
          />
        </div>
      </div>

      <ChatFab activeDealId={selectedDealId} />
    </div>
  );
}
