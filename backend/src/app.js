import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { config } from './config.js';
import { api, HttpError } from './api.js';

/** frontendDist: optional path of the built frontend to serve (standalone server only). */
export function createApp({ frontendDist } = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.use('/api', api);
  app.use('/uploads', express.static(config.uploadDir, { fallthrough: false }));

  // The standalone server also serves the built frontend (on Vercel the frontend is its own service).
  if (frontendDist && existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  }

  app.use((err, _req, res, _next) => {
    const status = err instanceof HttpError ? err.status
      : err instanceof multer.MulterError ? 400
      : err.status ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Server error' : err.message });
  });

  return app;
}
