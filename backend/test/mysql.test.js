// Needs a running MySQL; uses the database named by DB_NAME (default binsight_test).
process.env.DATA_STORE = 'mysql';
process.env.DB_NAME ??= 'binsight_test';
await import('./flow.js');
