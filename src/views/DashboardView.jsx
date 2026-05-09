import { useState, useMemo } from 'react';
import { Inbox, Mail, Star, Flame } from 'lucide-react';
import { useDeals } from '../contexts/DealsContext';
import { PipelineTimeline } from '../components/PipelineTimeline';
import TonightsRunCard from '../components/feed/TonightsRunCard';
import FeedDealCard from '../components/feed/FeedDealCard';
import AgentMessageCard from '../components/feed/AgentMessageCard';
import MessageInputBar from '../components/feed/MessageInputBar';
import RightRail from '../components/RightRail';

const FILTERS = [
  { id: 'all',    label: 'All',    Icon: Inbox },
  { id: 'unread', label: 'Unread', Icon: Mail },
  { id: 'saved',  label: 'Saved',  Icon: Star },
  { id: 'hot',    label: 'Hot',    Icon: Flame },
];

export function DashboardView({ kpis, searchQuery }) {
  const { deals, loading } = useDeals();
  const [agentMessages, setAgentMessages] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [filter, setFilter] = useState('all');

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

  if (loading) {
    return (
      <div className="feed-layout">
        <PipelineTimeline />
        <div className="feed-columns">
          <div className="feed-center-wrap">
            <div className="feed-center">
              <div className="feed-loading">Loading your deals…</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-layout">
      <PipelineTimeline />

      <div className="feed-columns">
        <div className="feed-center-wrap">
          <div className="feed-filter-chips">
            {FILTERS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`feed-filter-chip${filter === id ? ' active' : ''}`}
                onClick={() => setFilter(id)}
              >
                <Icon size={13} />
                <span>{label}</span>
                <span className="feed-filter-chip-count">{counts[id] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="feed-center" id="feed-scroll">
            <TonightsRunCard kpis={kpis} />

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
          </div>

          <MessageInputBar onMessage={handleMessage} activeDealId={selectedDealId} />
        </div>

        <RightRail
          deals={filteredDeals}
          selectedDealId={selectedDealId}
          onSelectDeal={id => setSelectedDealId(id === selectedDealId ? null : id)}
        />
      </div>
    </div>
  );
}
