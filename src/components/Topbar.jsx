import { I } from './Icons';

const TITLES = {
  dashboard: "Dashboard",
  deals: "My Deals",
  map: "Map View",
  boxes: "Buy Boxes",
  settings: "Account Settings"
};

export function Topbar({ view, onCreateBox }) {
  return (
    <header className="topbar">
      <div className="crumb">Deal Feed <span style={{ color: "var(--ink-4)", margin: "0 6px" }}>/</span> <b>{TITLES[view]}</b></div>
      <div className="topbar-spacer"/>
      <div className="topbar-search">
        <I.Search size={14}/>
        <input placeholder="Search by address, parcel ID, or owner entity..."/>
        <span className="topbar-kbd">⌘K</span>
      </div>
      <button className="topbar-icon-btn" title="Notifications">
        <I.Bell size={15}/>
        <span className="notif-pip"/>
      </button>
      {view !== "boxes" && (
        <button className="topbar-btn primary" onClick={onCreateBox}><I.Plus size={13}/> New Buy Box</button>
      )}
      <div className="avatar">MP</div>
    </header>
  );
}
