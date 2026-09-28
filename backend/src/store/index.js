import { config } from '../config.js';
import { memoryStore } from './memory.js';
import { mysqlStore } from './mysql.js';

export const store = config.dataStore === 'memory' ? memoryStore : mysqlStore;
