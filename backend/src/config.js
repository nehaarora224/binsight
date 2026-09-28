import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;

export const config = {
  port: Number(env.PORT ?? 4000),
  db: {
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER ?? 'binsight',
    password: env.DB_PASSWORD ?? 'binsight',
    database: env.DB_NAME ?? 'binsight',
  },
  // Optional URL of the Python image-assessment service. Without it a rule-based stand-in is used.
  aiServiceUrl: env.AI_SERVICE_URL || null,
  uploadDir: fileURLToPath(new URL('../uploads/', import.meta.url)),
  frontendDist: fileURLToPath(new URL('../../frontend/dist/', import.meta.url)),
  // The prototype has no login; every request acts as this worker.
  workerId: env.WORKER_ID ?? 'SW-1142',
};
