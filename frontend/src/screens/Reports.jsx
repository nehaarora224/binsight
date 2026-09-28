import { Icon, Tag } from '../components/ui.jsx';
import { LEVEL_TONE, TONE } from '../data.js';
import { daysSpanned, reportTime } from '../format.js';

export default function Reports({ reports, onNewReport }) {
  const days = daysSpanned(reports.map(r => r.createdAt));
  return (
    <div className="scroll">
      <div className="page">
        <div className="row-between" style={{ alignItems: 'center', padding: '0 2px' }}>
          <span className="note">
            {reports.length} {reports.length === 1 ? 'report' : 'reports'}
            {days > 0 && ` · ${days === 1 ? 'today' : `last ${days} days`}`}
          </span>
          <button className="new-report" onClick={onNewReport}><Icon name="plus" />NEW REPORT</button>
        </div>
        {reports.length > 0 && (
          <ul className="card" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {reports.map(r => (
              <li key={r.reportNo} className="report-row">
                <div className="row-between" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span className="mono report-id">{r.reportNo}</span>
                    <span className="small">{reportTime(r.createdAt)}</span>
                  </div>
                  <Tag tone={r.status === 'Submitted' ? TONE.blue : TONE.green}>{r.status}</Tag>
                </div>
                <div className="report-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span className="caps-label">LOCATION</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{r.location}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                    <span className="caps-label">WASTE LEVEL</span>
                    <Tag tone={LEVEL_TONE[r.level]} className="report-level">{r.level}</Tag>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
