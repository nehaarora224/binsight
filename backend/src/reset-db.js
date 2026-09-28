import { closeDatabase, initDatabase } from './db.js';
import { config } from './config.js';

await initDatabase({ reset: true });
await closeDatabase();
console.log(`Database "${config.db.database}" recreated with sample data.`);
