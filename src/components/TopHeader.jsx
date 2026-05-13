import { PipelineTimeline } from './PipelineTimeline';
import nightdropLogo from '../assets/nightdrop-logo.png';

export default function TopHeader() {
  return (
    <header className="top-header">
      <div className="top-header-left">
        <img src={nightdropLogo} alt="Nightdrop.ai" className="top-header-logo" />
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
