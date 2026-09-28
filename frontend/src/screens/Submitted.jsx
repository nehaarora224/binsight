import { Icon, Tag } from '../components/ui.jsx';
import { LEVEL_TONE } from '../data.js';
import { reportTime } from '../format.js';

export default function Submitted({ report, onHome, onReports }) {
  return (
    <div className="scroll">
      <div className="page" style={{ padding: '16px 12px', gap: 12 }}>
        <div className="card">
          <div className="done-head" role="status">
            <Icon name="check-circle" />
            <div className="done-title">REPORT SUBMITTED</div>
            <div className="note" style={{ fontSize: 14 }}>Recorded successfully</div>
          </div>
          <div className="kv"><span>Report ID</span><span className="mono">{report.reportNo}</span></div>
          <div className="kv"><span>Date &amp; time</span><span>{reportTime(report.createdAt)}</span></div>
          <div className="kv"><span>Location</span><span>{report.location}</span></div>
          <div className="kv"><span>Waste level</span><Tag tone={LEVEL_TONE[report.level]} className="tag-md">{report.level}</Tag></div>
          <div className="kv"><span>Status</span><span style={{ color: 'var(--green)' }}>Recorded successfully</span></div>
        </div>
        <button className="btn btn-green" onClick={onHome}>BACK TO HOME</button>
        <button className="btn btn-outline" onClick={onReports}>VIEW MY REPORTS</button>
      </div>
    </div>
  );
}
