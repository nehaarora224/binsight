import { config } from '../config.js';
import { closeDatabase, getPool, initDatabase, query } from '../db.js';
import { HttpError } from '../errors.js';

const REPORT_SELECT = `SELECT r.*, p.seq FROM reports r JOIN collection_points p ON p.id = r.point_id`;

async function getRoute() {
  const [r] = await query('SELECT * FROM routes WHERE worker_id = ? ORDER BY id LIMIT 1', [config.workerId]);
  return r ?? null;
}

/** MySQL-backed store. Rows use the database's column names. */
export const mysqlStore = {
  name: 'mysql',
  init: () => initDatabase(),
  reset: () => initDatabase({ reset: true }),
  close: closeDatabase,
  ping: () => query('SELECT 1'),

  async getWorker() {
    const [w] = await query('SELECT * FROM workers WHERE id = ?', [config.workerId]);
    return w ?? null;
  },
  getRoute,
  getPoints: routeId => query('SELECT * FROM collection_points WHERE route_id = ? ORDER BY seq', [routeId]),

  async startRoute(routeId) {
    await query('UPDATE routes SET started_at = UTC_TIMESTAMP(), ended_at = NULL WHERE id = ?', [routeId]);
    return getRoute();
  },
  async endRoute(routeId) {
    await query('UPDATE routes SET ended_at = UTC_TIMESTAMP() WHERE id = ?', [routeId]);
    return getRoute();
  },

  listReports: () =>
    query(`${REPORT_SELECT} WHERE r.worker_id = ? ORDER BY r.created_at DESC, r.id DESC`, [config.workerId]),

  async saveAssessment(a) {
    await query(
      `INSERT INTO assessments (id, point_id, image_path, level, category, priority, action, source, lat, lng, accuracy_m, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.point_id, a.image_path, a.level, a.category, a.priority, a.action, a.source, a.lat, a.lng, a.accuracy_m, a.created_at],
    );
  },

  /** Creates the report and marks the collection point as completed, atomically. */
  async submitReport(assessmentId, reportNo) {
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      const [[a]] = await conn.query('SELECT * FROM assessments WHERE id = ? FOR UPDATE', [assessmentId]);
      if (!a) throw new HttpError(404, 'Assessment not found');
      const [[used]] = await conn.query('SELECT id FROM reports WHERE assessment_id = ?', [assessmentId]);
      if (used) throw new HttpError(409, `Already submitted as ${reportNo(used.id)}`);

      const [ins] = await conn.query(
        `INSERT INTO reports (worker_id, point_id, assessment_id, level, category, priority, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'Submitted', UTC_TIMESTAMP())`,
        [config.workerId, a.point_id, a.id, a.level, a.category, a.priority],
      );
      await conn.query(
        "UPDATE collection_points SET status = 'done', level = ?, category = ? WHERE id = ?",
        [a.level, a.category, a.point_id],
      );
      await conn.commit();

      const [[row]] = await conn.query(`${REPORT_SELECT} WHERE r.id = ?`, [ins.insertId]);
      return row;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
