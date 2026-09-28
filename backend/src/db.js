import mysql from 'mysql2/promise';
import { config } from './config.js';
import { SCHEMA } from './schema.js';
import { seed } from './seed.js';

let pool;

export function getPool() {
  pool ??= mysql.createPool({
    ...config.db,
    timezone: 'Z',
    dateStrings: false,
    decimalNumbers: true,
    connectionLimit: 10,
  });
  return pool;
}

export async function query(sql, params) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Creates the database and tables if needed, and seeds sample data into an empty database. */
export async function initDatabase({ reset = false } = {}) {
  const { database, ...server } = config.db;
  const admin = await mysql.createConnection(server);
  try {
    if (reset) await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    try {
      await admin.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } catch (err) {
      // Hosted MySQL users often may not create databases; the provider has already created it.
      if (reset || !['ER_DBACCESS_DENIED_ERROR', 'ER_SPECIFIC_ACCESS_DENIED_ERROR'].includes(err.code)) throw err;
    }
  } finally {
    await admin.end();
  }
  for (const statement of SCHEMA) await query(statement);
  const [{ n }] = await query('SELECT COUNT(*) AS n FROM workers');
  if (n === 0) await seed(query);
}

export async function closeDatabase() {
  await pool?.end();
  pool = undefined;
}
