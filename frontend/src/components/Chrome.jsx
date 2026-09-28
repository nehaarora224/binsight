import { Icon } from './ui.jsx';
import { TITLES } from '../data.js';

export function StatusBar() {
  return (
    <div className="statusbar" aria-hidden="true">
      <span>9:41</span>
      <div className="statusbar-icons">
        <Icon name="cell-signal-full" />
        <Icon name="wifi-high" />
        <Icon name="battery-full" />
      </div>
    </div>
  );
}

export function Tricolor() {
  return (
    <div className="tricolor" aria-hidden="true">
      <div style={{ background: 'var(--saffron)' }} />
      <div style={{ background: '#fff' }} />
      <div style={{ background: 'var(--green)' }} />
    </div>
  );
}

export function HomeBar({ wardLabel }) {
  return (
    <header className="appbar appbar-home">
      <div className="logo"><Icon name="trash" /></div>
      <div className="appbar-text">
        <div className="brand">BINSIGHT</div>
        <div className="sub">{wardLabel}</div>
      </div>
      <div className="duty"><span className="duty-dot" />ON DUTY</div>
    </header>
  );
}

export function TitleBar({ screen, wardLabel, onBack, showHindi }) {
  const [title, hindi] = TITLES[screen] || ['', ''];
  return (
    <header className="appbar appbar-titled">
      {onBack && (
        <button className="back" onClick={onBack} aria-label="Back"><Icon name="arrow-left" /></button>
      )}
      <div className="appbar-text">
        <h1 className="page-title" style={{ margin: 0 }}>{title}</h1>
        {showHindi && <div className="sub">{hindi}</div>}
        <div className="sub">{wardLabel}</div>
      </div>
    </header>
  );
}

const TABS = [
  ['home', 'HOME', 'house'],
  ['route', 'ROUTE', 'map-trifold'],
  ['reports', 'REPORTS', 'list-checks'],
  ['more', 'MORE', 'dots-three-outline'],
];

export function BottomNav({ active, onNavigate }) {
  return (
    <nav className="bottomnav">
      {TABS.map(([key, label, icon]) => (
        <button
          key={key}
          className={`nav-btn${key === active ? ' active' : ''}`}
          aria-current={key === active ? 'page' : undefined}
          onClick={() => onNavigate(key)}
        >
          <Icon name={icon} />
          {label}
        </button>
      ))}
    </nav>
  );
}
