import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;

// DATABASE_URL (mysql://user:pass@host:port/db), as given by hosted MySQL providers, overrides DB_*.
const url = env.DATABASE_URL ? new URL(env.DATABASE_URL) : null;
const ssl = env.DB_SSL === 'true' || url?.searchParams.get('ssl') === 'true' || url?.searchParams.has('ssl-mode');

export const config = {
  port: Number(env.PORT ?? 4000),
  db: {
    host: url?.hostname ?? env.DB_HOST ?? 'localhost',
    port: Number(url?.port || env.DB_PORT || 3306),
    user: url ? decodeURIComponent(url.username) : env.DB_USER ?? 'binsight',
    password: url ? decodeURIComponent(url.password) : env.DB_PASSWORD ?? 'binsight',
    database: url?.pathname.slice(1) || env.DB_NAME || 'binsight',
    // Hosted MySQL (Aiven, TiDB Cloud, PlanetScale, ...) requires TLS.
    ...(ssl && { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }),
  },
  // Optional URL of the Python image-assessment service. Without it a rule-based stand-in is used.
  aiServiceUrl: env.AI_SERVICE_URL || null,
  // Serverless platforms only allow writes to the temp directory.
  uploadDir: env.UPLOAD_DIR
    ?? (env.VERCEL ? path.join(tmpdir(), 'binsight-uploads') : fileURLToPath(new URL('../uploads/', import.meta.url))),
  // 'mysql', or 'memory' for built-in sample data without a database. On Vercel the in-memory
  // store is used automatically until a database is configured.
  dataStore: env.DATA_STORE
    ?? (env.VERCEL && !env.DATABASE_URL && !env.DB_HOST ? 'memory' : 'mysql'),
  // The prototype has no login; every request acts as this worker.
  workerId: env.WORKER_ID ?? 'SW-1142',
};
