import { PipelineTimeline } from './PipelineTimeline';

export default function TopHeader() {
  return (
    <header className="top-header">
      <div className="top-header-left">
        <div className="top-header-wordmark">
          <span className="top-header-logo-dot" />
          Nightdrop.ai
        </div>
        <PipelineTimeline mode="phase" />
      </div>

      <div className="top-header-center">
        <PipelineTimeline mode="track" showLabels showPhase={false} />
      </div>

      <div className="top-header-right">
        <PipelineTimeline mode="countdown" size="header" />
      </div>
    </header>
  );
}
