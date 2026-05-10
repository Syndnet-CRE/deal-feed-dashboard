import { useState, useMemo } from 'react';
import { Star, Flame, Mail, Inbox } from 'lucide-react';
import { useDeals } from '../contexts/DealsContext';
import { PipelineTimeline } from '../components/PipelineTimeline';
import FeedDealCard from '../components/feed/FeedDealCard';
import AgentMessageCard from '../components/feed/AgentMessageCard';
import ChatFab from '../components/feed/ChatFab';
import RightRail from '../components/RightRail';
import LeftRail from '../components/LeftRail';

export function DashboardView({ kpis, searchQuery, filter = 'all', setFilter = () => {} }) {
  const { deals, loading } = useDeals();
  const [agentMessages, setAgentMessages] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [selectedDealId, setSelectedDealId] = useState(null);

  const filteredDeals = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return deals
      .filter(d => !hiddenIds.has(d.id))
      .filter(d => {
        if (filter === 'unread') return !d.is_read;
        if (filter === 'saved')  return !!d.saved;
        if (filter === 'hot')    return d.feedback === 'hot' || (d.score || d.match_score || 0) >= 8;
        return true;
      })
      .filter(d => {
        if (!q) return true;
        const addr = (d.addr || d.address || '').toLowerCase();
        const asset = (d.asset_class || d.asset || '').toLowerCase();
        return addr.includes(q) || asset.includes(q);
      });
  }, [deals, hiddenIds, searchQuery, filter]);

  function handleHide(id) {
    setHiddenIds(prev => new Set([...prev, id]));
  }

  function handleMessage(msg) {
    setAgentMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }

  const counts = useMemo(() => ({
    all:    deals.filter(d => !hiddenIds.has(d.id)).length,
    unread: deals.filter(d => !hiddenIds.has(d.id) && !d.is_read).length,
    saved:  deals.filter(d => !hiddenIds.has(d.id) && d.saved).length,
    hot:    deals.filter(d => !hiddenIds.has(d.id) && (d.feedback === 'hot' || (d.score || d.match_score || 0) >= 8)).length,
  }), [deals, hiddenIds]);

  return (
    <div className="feed-layout">
      <div className="feed-band-wrap">
        <PipelineTimeline />
      </div>

      <div className="feed-scroll-area">
        <div className="feed-content-row">
          <LeftRail
            filter={filter}
            setFilter={setFilter}
            counts={counts}
            kpis={kpis}
          />

          <div className="feed-center-col">
            <div className="feed-center" id="feed-scroll">
              {loading ? (
                <div className="feed-loading">Loading your deals…</div>
              ) : (
                <>
                  {agentMessages.map(msg =>
                    msg.role === 'agent'
                      ? <AgentMessageCard key={msg.id} message={msg} />
                      : (
                        <div key={msg.id} className="user-message-card">
                          <span className="user-message-content">{msg.content}</span>
                        </div>
                      )
                  )}

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

      <ChatFab onMessage={handleMessage} activeDealId={selectedDealId} />
    </div>
  );
}
