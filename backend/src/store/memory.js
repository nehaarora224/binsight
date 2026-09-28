import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { POINTS, REPORTS, istTime } from '../seed.js';

// In-memory store with the same sample data as the MySQL seed. Used when no database is
// configured (e.g. a Vercel deployment without DATABASE_URL). Changes last until the
// server instance restarts, and are not shared between serverless instances.

let db;

function freshData() {
  const points = POINTS.map(([seq, area, lat, lng, dist, fill, level, category, priority, status]) => {
    const nn = String(seq).padStart(2, '0');
    return {
      id: seq, route_id: 'R-12A', seq, code: `CP-${nn}`, name: `Community Waste Collection Point ${nn}`,
      area, lat, lng, distance_km: dist, fill_pct: fill, level, category, priority, status,
    };
  });
  const reports = REPORTS.map(([id, seq, daysAgo, hh, mm, level, category, priority]) => ({
    id, worker_id: config.workerId, point_id: seq, assessment_id: null,
    level, category, priority, status: 'Collected', created_at: istTime(daysAgo, hh, mm),
  }));
  return {
    worker: {
      id: config.workerId, role: 'Field Worker', ward: 'Ward 12', ward_name: 'West Delhi',
      shift_start: '06:00:00', shift_end: '14:00:00',
    },
    route: {
      id: 'R-12A', worker_id: config.workerId, distance_km: 11.4, est_minutes: 200,
      center_lat: 28.639489, center_lng: 77.120719, zoom: 16, started_at: null, ended_at: null,
    },
    points,
    reports,
    assessments: new Map(),
    nextReportId: 2481,
  };
}

const withSeq = r => ({ ...r, seq: db.points.find(p => p.id === r.point_id).seq });

export const memoryStore = {
  name: 'memory',
  init: async () => { db ??= freshData(); },
  reset: async () => { db = freshData(); },
  close: async () => {},
  ping: async () => {},

  getWorker: async () => ({ ...db.worker }),
  getRoute: async () => ({ ...db.route }),
  getPoints: async routeId => db.points.filter(p => p.route_id === routeId).map(p => ({ ...p })),

  async startRoute() {
    Object.assign(db.route, { started_at: new Date(), ended_at: null });
    return { ...db.route };
  },
  async endRoute() {
    db.route.ended_at = new Date();
    return { ...db.route };
  },

  listReports: async () =>
    db.reports
      .filter(r => r.worker_id === config.workerId)
      .sort((a, b) => b.created_at - a.created_at || b.id - a.id)
      .map(withSeq),

  saveAssessment: async a => { db.assessments.set(a.id, { ...a }); },

  async submitReport(assessmentId, reportNo) {
    const a = db.assessments.get(assessmentId);
    if (!a) throw new HttpError(404, 'Assessment not found');
    const used = db.reports.find(r => r.assessment_id === assessmentId);
    if (used) throw new HttpError(409, `Already submitted as ${reportNo(used.id)}`);

    const report = {
      id: db.nextReportId++, worker_id: config.workerId, point_id: a.point_id, assessment_id: a.id,
      level: a.level, category: a.category, priority: a.priority, status: 'Submitted', created_at: new Date(),
    };
    db.reports.push(report);
    Object.assign(db.points.find(p => p.id === a.point_id), { status: 'done', level: a.level, category: a.category });
    return withSeq(report);
  },
};
