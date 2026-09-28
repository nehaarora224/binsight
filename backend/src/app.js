import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { config } from './config.js';
import { api, HttpError } from './api.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use('/api', api);
  app.use('/uploads', express.static(config.uploadDir, { fallthrough: false }));

  // In production the backend also serves the built frontend.
  if (existsSync(config.frontendDist)) {
    app.use(express.static(config.frontendDist));
    app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(config.frontendDist, 'index.html')));
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
