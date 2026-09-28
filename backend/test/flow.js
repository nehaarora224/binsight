// API flow tests, run once per data store by mysql.test.js and memory.test.js.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

const { store } = await import('../src/store/index.js');
const { createApp } = await import('../src/app.js');

let server, base;

before(async () => {
  await store.reset();
  server = createApp().listen(0);
  await new Promise(r => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await store.close();
});

const get = async p => (await fetch(base + p)).json();
const post = (p, body) => fetch(base + p, {
  method: 'POST',
  ...(body instanceof FormData ? { body } : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) }),
});

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const photo = (fields = {}) => {
  const form = new FormData();
  form.append('image', new Blob([PNG], { type: 'image/png' }), 'IMG_0942.png');
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  return form;
};

test('dashboard matches the seeded day', async () => {
  const d = await get('/dashboard');
  assert.deepEqual(d.counts, { total: 6, completed: 2, remaining: 4 });
  assert.equal(d.nextPoint.code, 'CP-04');
  assert.equal(d.nextPoint.fillPct, 78);
  assert.equal(d.route.distanceKm, 11.4);
  assert.equal(d.worker.wardName, 'West Delhi');
});

test('route lists six points in order', async () => {
  const r = await get('/route');
  assert.deepEqual(r.points.map(p => p.seq), [1, 2, 3, 4, 5, 6]);
  assert.equal(r.route.startedAt, null);
});

test('route can be started and ended', async () => {
  assert.ok((await (await post('/route/start')).json()).startedAt);
  assert.equal((await (await post('/route/end')).json()).startedAt, null);
});

test('assessment requires an image', async () => {
  const res = await post('/assessments', new FormData());
  assert.equal(res.status, 400);
});

test('full report flow updates collection status', async () => {
  const res = await post('/assessments', photo({ pointId: 999 }));
  assert.equal(res.status, 201);
  const a = await res.json();
  assert.equal(a.point.code, 'CP-04', 'falls back to the next point');
  assert.deepEqual([a.level, a.category, a.priority, a.action], ['HIGH', 'MIXED', 'URGENT', 'Collect within 2 hours']);

  const img = await fetch(new URL(a.imageUrl, base));
  assert.equal(img.status, 200);

  const sub = await post('/reports', { assessmentId: a.id });
  assert.equal(sub.status, 201);
  const report = await sub.json();
  assert.equal(report.reportNo, 'WS-02481');
  assert.equal(report.location, 'Community Point 04');
  assert.equal(report.status, 'Submitted');

  assert.equal((await post('/reports', { assessmentId: a.id })).status, 409);

  const d = await get('/dashboard');
  assert.deepEqual(d.counts, { total: 6, completed: 3, remaining: 3 });
  assert.equal(d.nextPoint.code, 'CP-03');

  const reports = await get('/reports');
  assert.equal(reports.length, 6);
  assert.equal(reports[0].reportNo, 'WS-02481');
});

test('GPS fix near a point selects that point', async () => {
  const a = await (await post('/assessments', photo({ lat: 28.641429, lng: 77.12117, accuracy: 8 }))).json();
  assert.equal(a.point.code, 'CP-06');
});
