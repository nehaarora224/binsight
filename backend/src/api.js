import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { config } from './config.js';
import { HttpError } from './errors.js';
import { store } from './store/index.js';
import { assessImage } from './assess.js';

mkdirSync(config.uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase() || '.jpg'}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

export { HttpError };

// ---------- mapping ----------

const reportNo = id => `WS-${String(id).padStart(5, '0')}`;

const toPoint = p => ({
  id: p.id, seq: p.seq, code: p.code, name: p.name, area: p.area,
  lat: p.lat, lng: p.lng, distanceKm: p.distance_km, fillPct: p.fill_pct,
  level: p.level, category: p.category, priority: p.priority, status: p.status,
});

const toRoute = r => ({
  id: r.id, distanceKm: r.distance_km, estMinutes: r.est_minutes,
  center: [r.center_lat, r.center_lng], zoom: r.zoom,
  startedAt: r.started_at && !r.ended_at ? r.started_at : null,
});

const toReport = r => ({
  reportNo: reportNo(r.id), pointId: r.point_id, location: `Community Point ${String(r.seq).padStart(2, '0')}`,
  level: r.level, category: r.category, priority: r.priority, status: r.status, createdAt: r.created_at,
});

// ---------- queries ----------

async function getWorker() {
  const w = await store.getWorker();
  if (!w) throw new HttpError(404, 'Worker not found');
  return w;
}

async function getRoute() {
  const r = await store.getRoute();
  if (!r) throw new HttpError(404, 'No route assigned');
  return r;
}

const getPoints = routeId => store.getPoints(routeId);

/** High-priority pending points first, then route order. */
const nextPoint = points =>
  points.find(p => p.status === 'pending' && p.priority === 'high') ?? points.find(p => p.status === 'pending') ?? null;

function metresBetween(aLat, aLng, bLat, bLng) {
  const rad = d => (d * Math.PI) / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// ---------- routes ----------

export const api = express.Router();

api.use('/uploads', express.static(config.uploadDir, { fallthrough: false }));

api.get('/health', async (_req, res) => {
  await store.ping();
  res.json({ ok: true, store: store.name });
});

api.get('/dashboard', async (_req, res) => {
  const [worker, route] = await Promise.all([getWorker(), getRoute()]);
  const points = await getPoints(route.id);
  const completed = points.filter(p => p.status === 'done').length;
  const next = nextPoint(points);
  res.json({
    worker: {
      id: worker.id, role: worker.role, ward: worker.ward, wardName: worker.ward_name,
      shift: { start: worker.shift_start.slice(0, 5), end: worker.shift_end.slice(0, 5) },
    },
    route: toRoute(route),
    counts: { total: points.length, completed, remaining: points.length - completed },
    nextPoint: next && toPoint(next),
  });
});

api.get('/route', async (_req, res) => {
  const route = await getRoute();
  const points = await getPoints(route.id);
  res.json({ route: toRoute(route), points: points.map(toPoint), nextPointId: nextPoint(points)?.id ?? null });
});

api.post('/route/start', async (_req, res) => {
  const route = await getRoute();
  res.json(toRoute(await store.startRoute(route.id)));
});

api.post('/route/end', async (_req, res) => {
  const route = await getRoute();
  res.json(toRoute(await store.endRoute(route.id)));
});

api.get('/reports', async (_req, res) => {
  res.json((await store.listReports()).map(toReport));
});

/**
 * Step 1–3 of reporting: upload the captured image, resolve the collection point
 * (nearest to the GPS fix, else the one given), and run the AI assessment.
 */
api.post('/assessments', upload.single('image'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'An image file is required');
  const lat = parseFloat(req.body.lat), lng = parseFloat(req.body.lng);
  const accuracy = parseFloat(req.body.accuracy);
  const hasFix = Number.isFinite(lat) && Number.isFinite(lng);

  const route = await getRoute();
  const points = await getPoints(route.id);
  let point = points.find(p => p.id === Number(req.body.pointId));
  if (hasFix) {
    const nearest = points
      .map(p => ({ p, d: metresBetween(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.d - b.d)[0];
    if (nearest && nearest.d <= 150) point = nearest.p;
  }
  point ??= nextPoint(points) ?? points[0];
  if (!point) throw new HttpError(404, 'No collection point to report');

  const result = await assessImage({ imagePath: req.file.path, mimeType: req.file.mimetype, point });
  const id = randomUUID();
  const createdAt = new Date();
  await store.saveAssessment({
    id, point_id: point.id, image_path: req.file.filename, level: result.level, category: result.category,
    priority: result.priority, action: result.action, source: result.source,
    lat: hasFix ? lat : null, lng: hasFix ? lng : null,
    accuracy_m: Number.isFinite(accuracy) ? Math.round(accuracy) : null, created_at: createdAt,
  });
  res.status(201).json({
    id, point: toPoint(point), ...result,
    imageUrl: `/api/uploads/${req.file.filename}`, createdAt,
  });
});

/** Step 4: submit the report. This also marks the collection point as completed. */
api.post('/reports', express.json(), async (req, res) => {
  const assessmentId = req.body?.assessmentId;
  if (typeof assessmentId !== 'string') throw new HttpError(400, 'assessmentId is required');

  const row = await store.submitReport(assessmentId, reportNo);
  res.status(201).json(toReport(row));
});

api.use((_req, _res, next) => next(new HttpError(404, 'Not found')));
