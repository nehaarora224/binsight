// Sample data for Ward 12 · West Delhi, matching the v5 design.

const IST_OFFSET_MS = 330 * 60 * 1000;

/** UTC Date for a wall-clock time in India, `daysAgo` days before today (IST). */
function istTime(daysAgo, hh, mm) {
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const utc = Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate() - daysAgo, hh, mm);
  return new Date(utc - IST_OFFSET_MS);
}

const POINTS = [
  // seq, area, lat, lng, distance, fill, level, category, priority, status
  [1, 'Vishal Enclave Rd', 28.637286, 77.117865, 0.0, 22, 'LOW', 'DRY', 'normal', 'done'],
  [2, 'Rajouri Garden J Block', 28.63834, 77.119281, 0.6, 55, 'MEDIUM', 'ORGANIC', 'normal', 'done'],
  [3, 'Tagore Garden Ext.', 28.637738, 77.120955, 0.9, 48, 'MEDIUM', 'PLASTIC', 'normal', 'pending'],
  [4, 'Rajouri Garden Market', 28.639433, 77.122157, 1.2, 78, 'HIGH', 'MIXED', 'high', 'pending'],
  [5, 'Subhash Nagar Rd', 28.640788, 77.123315, 1.9, 30, 'LOW', 'ORGANIC', 'normal', 'pending'],
  [6, 'Tilak Nagar Chowk', 28.641429, 77.12117, 2.3, 52, 'MEDIUM', 'MIXED', 'normal', 'pending'],
];

const REPORTS = [
  // id, seq, daysAgo, hh, mm, level, category, priority
  [2461, 5, 2, 9, 5, 'LOW', 'ORGANIC', 'LOW'],
  [2468, 3, 1, 11, 32, 'MEDIUM', 'PLASTIC', 'NORMAL'],
  [2474, 6, 1, 16, 10, 'OVERFLOW', 'MIXED', 'URGENT'],
  [2479, 1, 0, 7, 31, 'LOW', 'DRY', 'LOW'],
  [2480, 2, 0, 8, 16, 'MEDIUM', 'ORGANIC', 'NORMAL'],
];

export async function seed(query) {
  await query(
    `INSERT INTO workers (id, role, ward, ward_name, shift_start, shift_end)
     VALUES ('SW-1142', 'Field Worker', 'Ward 12', 'West Delhi', '06:00', '14:00')`,
  );
  await query(
    `INSERT INTO routes (id, worker_id, distance_km, est_minutes, center_lat, center_lng, zoom)
     VALUES ('R-12A', 'SW-1142', 11.4, 200, 28.639489, 77.120719, 16)`,
  );
  for (const [seq, area, lat, lng, dist, fill, level, category, priority, status] of POINTS) {
    const nn = String(seq).padStart(2, '0');
    await query(
      `INSERT INTO collection_points
         (route_id, seq, code, name, area, lat, lng, distance_km, fill_pct, level, category, priority, status)
       VALUES ('R-12A', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [seq, `CP-${nn}`, `Community Waste Collection Point ${nn}`, area, lat, lng, dist, fill, level, category, priority, status],
    );
  }
  for (const [id, seq, daysAgo, hh, mm, level, category, priority] of REPORTS) {
    await query(
      `INSERT INTO reports (id, worker_id, point_id, level, category, priority, status, created_at)
       SELECT ?, 'SW-1142', id, ?, ?, ?, 'Collected', ? FROM collection_points WHERE seq = ?`,
      [id, level, category, priority, istTime(daysAgo, hh, mm), seq],
    );
  }
}
