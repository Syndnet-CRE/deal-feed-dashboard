import { useState, useMemo } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { PipelineTimeline } from '../components/PipelineTimeline';
import TonightsRunCard from '../components/feed/TonightsRunCard';
import FeedDealCard from '../components/feed/FeedDealCard';
import AgentMessageCard from '../components/feed/AgentMessageCard';
import MessageInputBar from '../components/feed/MessageInputBar';
import RightRail from '../components/RightRail';

export function DashboardView({ kpis, searchQuery }) {
  const { deals, loading } = useDeals();
  const [agentMessages, setAgentMessages] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [selectedDealId, setSelectedDealId] = useState(null);

  const filteredDeals = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return deals
      .filter(d => !hiddenIds.has(d.id))
      .filter(d => {
        if (!q) return true;
        const addr = (d.addr || d.address || '').toLowerCase();
        const asset = (d.asset_class || d.asset || '').toLowerCase();
        return addr.includes(q) || asset.includes(q);
      });
  }, [deals, hiddenIds, searchQuery]);

  function handleHide(id) {
    setHiddenIds(prev => new Set([...prev, id]));
  }

  function handleMessage(msg) {
    setAgentMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }

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
              <div className="feed-empty">
                {searchQuery ? 'No deals match your search.' : "No deals yet — check back after tonight's run."}
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
