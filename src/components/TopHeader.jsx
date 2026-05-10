import { PipelineTimeline } from './PipelineTimeline';

export default function TopHeader() {
  return (
    <header className="top-header">
      <div className="top-header-wordmark">
        <span className="top-header-logo-dot" />
        Nightdrop.ai
      </div>

      <div className="top-header-pipeline">
        <PipelineTimeline mode="track" compact />
      </div>
    </header>
  );
}
