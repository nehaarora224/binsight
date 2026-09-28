import { Icon, SectionHead, Tag } from '../components/ui.jsx';
import { LEVEL_BAR, LEVEL_TEXT, TONE } from '../data.js';
import { duration, km, longDate, title } from '../format.js';

function NextPoint({ point, wardLabel, onRoute, onReport }) {
  if (!point) {
    return (
      <div className="card card-pad" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="check-circle" style={{ fontSize: 22, color: 'var(--green)' }} />
        <span style={{ fontSize: 15, fontWeight: 600 }}>All collection points completed</span>
      </div>
    );
  }
  const high = point.priority === 'high';
  return (
    <div className="card">
      <div className="wo-head">
        <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{point.code} · {km(point.distanceKm)}</span>
        <Tag tone={high ? TONE.red : TONE.grey} className="tag-wide">{high ? 'HIGH PRIORITY' : 'PENDING'}</Tag>
      </div>
      <div className="wo-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="wo-name">{point.name}</div>
          <div className="note">{point.area} · {wardLabel}</div>
        </div>
        <div className="grid2" style={{ gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="small">Waste level</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: LEVEL_TEXT[point.level] }}>{point.fillPct}%</span>
            <div className="bar bar-thin"><div style={{ width: `${point.fillPct}%`, background: LEVEL_BAR[point.level] }} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="small">Waste category</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{title(point.category)} Waste</span>
          </div>
        </div>
        <div className="grid2">
          <button className="btn btn-sm neutral" onClick={onRoute}><Icon name="map-pin" />VIEW LOCATION</button>
          <button className="btn btn-sm green" onClick={onReport}><Icon name="play" />START COLLECTION</button>
        </div>
      </div>
    </div>
  );
}

export default function Home({ dashboard, wardLabel, showHindi, onRoute, onReport }) {
  const { worker, route, counts, nextPoint } = dashboard;
  const pct = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;

  return (
    <div className="scroll">
      <div className="page home">
        <div className="meta-row"><span>{worker.role} · {worker.ward}</span><span>{longDate()}</span></div>

        <section className="section">
          <SectionHead title="Today's collection" hindi="आज का संग्रह" showHindi={showHindi} />
          <div className="card">
            <div className="stats">
              <div className="stat"><div className="stat-num">{counts.total}</div><div className="stat-label">Collection points</div></div>
              <div className="stat"><div className="stat-num" style={{ color: 'var(--green)' }}>{counts.completed}</div><div className="stat-label">Completed</div></div>
              <div className="stat"><div className="stat-num">{counts.remaining}</div><div className="stat-label">Remaining</div></div>
            </div>
            <div className="route-box">
              <div className="row-between">
                <div className="h17">Today's route</div>
                <div className="mono small">{route.id}</div>
              </div>
              <div className="grid2">
                <div className="field"><span>Approx. route</span><span>{km(route.distanceKm)}</span></div>
                <div className="field"><span>Est. time</span><span>{duration(route.estMinutes)}</span></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${pct}%`, background: 'var(--green)' }} />
                </div>
                <div className="small">{counts.completed} of {counts.total} points completed</div>
              </div>
              <button className="btn btn-green" onClick={onRoute}><Icon name="map-trifold" />VIEW TODAY'S ROUTE</button>
            </div>
          </div>
        </section>

        <section className="section">
          <SectionHead title="Next collection point" hindi="अगला संग्रह बिंदु" showHindi={showHindi} />
          <NextPoint point={nextPoint} wardLabel={wardLabel} onRoute={onRoute} onReport={onReport} />
        </section>

        <section className="section">
          <SectionHead title="Report a waste point" hindi="कचरा बिंदु रिपोर्ट करें" showHindi={showHindi} />
          <div className="card card-pad" style={{ gap: 12 }}>
            <p className="body-text">Capture an image of a communal/designated waste collection point to record its current condition.</p>
            <div className="steps-inline"><span>1 Capture image</span><span>2 Confirm location</span><span>3 Assessment</span><span>4 Submit</span></div>
            <button className="btn btn-blue" onClick={onReport}><Icon name="camera" />CAPTURE IMAGE</button>
          </div>
        </section>
      </div>
    </div>
  );
}
