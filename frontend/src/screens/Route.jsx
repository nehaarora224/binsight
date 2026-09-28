import RouteMap from '../components/RouteMap.jsx';
import { Icon, Tag } from '../components/ui.jsx';
import { STOP_STYLE, stopState } from '../data.js';
import { clock, km, title } from '../format.js';

const nn = seq => String(seq).padStart(2, '0');

export default function Route({ data, busy, onToggleRoute }) {
  const { route, points, nextPointId } = data;
  const next = points.find(p => p.id === nextPointId);

  return (
    <>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="map-wrap">
          <RouteMap route={route} points={points} />
          <div className="map-chip">
            <span className="mono">{route.id}</span>
            <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{km(route.distanceKm)} · {points.length} points</span>
          </div>
          <div className="map-legend">
            {Object.values(STOP_STYLE).map(({ marker, label }) => (
              <span key={label}>
                <span className="swatch" style={{ background: marker }} />
                {label === 'HIGH PRIORITY' ? 'High priority' : label}
              </span>
            ))}
          </div>
        </div>

        {route.startedAt && (
          <div className="route-banner" role="status">
            <Icon name="navigation-arrow" />
            <span>
              <b>Route started {clock(route.startedAt)}</b>
              {next ? ` · Next: Point ${nn(next.seq)}` : ' · All points completed'}
            </span>
          </div>
        )}

        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {points.map(p => {
            const st = STOP_STYLE[stopState(p)];
            const level = title(p.level) + (p.level === 'HIGH' || p.level === 'OVERFLOW' ? ` · ${p.fillPct}%` : '');
            return (
              <li key={p.id} className="stop-row">
                <div className="stop-num" style={{ background: st.marker }}>{nn(p.seq)}</div>
                <div className="stop-text">
                  <div className="stop-name">Collection Point {nn(p.seq)}</div>
                  <div className="small">{p.area} · {level}</div>
                </div>
                <Tag tone={st.tone}>{st.label}</Tag>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="footer-action">
        <button className={`btn ${route.startedAt ? 'btn-dark' : 'btn-green'}`} disabled={busy} onClick={onToggleRoute}>
          <Icon name="navigation-arrow" />{route.startedAt ? 'END ROUTE' : 'START ROUTE'}
        </button>
      </div>
    </>
  );
}
