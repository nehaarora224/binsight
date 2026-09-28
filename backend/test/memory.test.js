// Built-in sample data, no database needed.
process.env.DATA_STORE = 'memory';
await import('./flow.js');
