// Serverless entry point (Vercel's Express runtime picks up the default export).
// For a long-running local server use `npm start` (src/server.js).
import express from 'express';
import { createApp } from './src/app.js';
import { store } from './src/store/index.js';

const app = express();
let ready;

// There is no startup hook on serverless, so the schema/seed check runs once per instance on first request.
app.use(async (_req, _res, next) => {
  try {
    await (ready ??= store.init());
    next();
  } catch (err) {
    ready = undefined;
    next(err);
  }
});
app.use(createApp());
app.use((err, _req, res, _next) => {
  console.error('Database initialisation failed:', err);
  res.status(503).json({ error: 'Database unavailable' });
});

export default app;
