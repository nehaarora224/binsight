import { Icon } from '../components/ui.jsx';

export default function More({ worker, showHindi, onToggleHindi }) {
  return (
    <div className="scroll">
      <div className="page" style={{ gap: 12 }}>
        <div className="card">
          <div className="kv kv-tight"><span>Role</span><span>{worker.role} · {worker.ward}</span></div>
          <div className="kv kv-tight"><span>Employee ID</span><span className="mono">{worker.id}</span></div>
          <div className="kv kv-tight"><span>Shift</span><span>{worker.shift.start} – {worker.shift.end}</span></div>
        </div>
        <div className="card">
          <button className="menu-row" onClick={onToggleHindi}>
            <Icon name="translate" />
            <span>Language</span>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>{showHindi ? 'English + हिन्दी' : 'English'}</span>
            <Icon name="caret-right" className="caret" />
          </button>
          <button className="menu-row">
            <Icon name="phone" />
            <span>Ward office helpline</span>
            <Icon name="caret-right" className="caret" />
          </button>
          <button className="menu-row">
            <Icon name="question" />
            <span>How to report a waste point</span>
            <Icon name="caret-right" className="caret" />
          </button>
          <button className="menu-row danger">
            <Icon name="sign-out" />
            <span>Log out</span>
          </button>
        </div>
        <div className="app-version">
          <span style={{ fontWeight: 700, letterSpacing: '.06em' }}>BINSIGHT v1.0</span>
          <span style={{ letterSpacing: '.04em' }}>AI-ASSISTED SMART WASTE COLLECTION</span>
        </div>
      </div>
    </div>
  );
}
