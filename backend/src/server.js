import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { initDatabase } from './db.js';
import { createApp } from './app.js';

try {
  await initDatabase();
} catch (err) {
  console.error(`Could not reach MySQL at ${config.db.host}:${config.db.port} as "${config.db.user}".`);
  console.error('Start MySQL (e.g. `docker compose up -d mysql`) and check backend/.env.');
  console.error(err.message);
  process.exit(1);
}

const frontendDist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));

createApp({ frontendDist }).listen(config.port, () => {
  console.log(`Binsight API listening on http://localhost:${config.port}`);
});
